/**
 * Account actions - withdraw a citizen's earnings to an external wallet.
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { isAddress } from "viem";
import type { Hex } from "viem";
import { currentCitizen } from "@/lib/auth";
import { withdrawFromGateway, depositToGateway, readerBalances, ensureGas } from "@/lib/treasury";
import { sql } from "@/lib/db";

export type WithdrawResult =
  | { ok: true; txHash: string; amount: string }
  | { ok: false; error: string };

export async function withdrawUsdc(amount: string, destAddress: string): Promise<WithdrawResult> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  if (!isAddress(destAddress)) return { ok: false, error: "Enter a valid destination address (0x…)." };
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) return { ok: false, error: "Enter an amount greater than 0." };

  try {
    const res = await withdrawFromGateway(cit.privKey, amount, destAddress as `0x${string}`);
    await sql`
      insert into withdrawals (user_id, amount_usdc, destination_chain, destination_address, status, tx_hash)
      values (${cit.user.id}, ${amount}, 'arcTestnet', ${destAddress}, 'confirmed', ${res.mintTxHash})`;
    return { ok: true, txHash: res.mintTxHash, amount: res.formattedAmount };
  } catch (error) {
    return { ok: false, error: (error as Error).message.slice(0, 160) };
  }
}

export type DepositResult =
  | { ok: true; txHash: string; amount: string }
  | { ok: false; error: string };

/**
 * Move the citizen's loose wallet USDC into Circle Gateway, making it spendable
 * (and withdrawable). Moves `amount` if given (must not exceed the loose
 * balance), otherwise the full loose balance. Tops up gas from the treasury
 * first - the deposit is an on-chain transaction and a citizen who claimed
 * from the faucet may have no gas left.
 */
export async function sweepToGateway(amount?: string): Promise<DepositResult> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };

  let loose = "0";
  try {
    const bal = await readerBalances(cit.privKey as Hex);
    loose = bal.wallet.formatted ?? "0";
  } catch {
    return { ok: false, error: "Couldn't read your wallet balance. Try again." };
  }
  if (Number(loose) <= 0) {
    return { ok: false, error: "Nothing to move - your wallet has no loose USDC yet." };
  }

  let toMove = loose;
  if (amount !== undefined && amount.trim() !== "") {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return { ok: false, error: "Enter an amount greater than 0." };
    if (amt > Number(loose)) {
      return { ok: false, error: `Only $${Number(loose).toFixed(4)} is loose in your wallet.` };
    }
    toMove = amount.trim();
  }

  try {
    await ensureGas(cit.privKey as Hex);
    const res = await depositToGateway(cit.privKey as Hex, toMove);
    return { ok: true, txHash: res.depositTxHash, amount: res.formattedAmount };
  } catch (error) {
    return { ok: false, error: (error as Error).message.slice(0, 160) };
  }
}
