/**
 * Custodial reader-wallet engine (server-only).
 *
 * A reader never touches crypto: we mint a wallet, fund it from the treasury
 * (native gas + ERC-20 USDC), and deposit into Circle Gateway so the reader can
 * pay per-read instantly. Mirrors the funding flow in agent.mts.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { erc20Abi, parseEther, parseUnits, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET_USDC, publicClient, treasuryKey, walletClientFor } from "./arc";

// Native USDC sent for gas (Arc gas = USDC with 18 decimals). Kept small -
// reads settle gaslessly via Gateway, so a wallet only needs gas for its
// one-time deposit + approval.
const GAS_FUND = parseEther("0.006");
// Starting credit each citizen gets, in USDC (6 decimals on the ERC-20).
// Small by default (~20 reads) so the treasury lasts; users top up their own
// wallet from the faucet for more (and for Pro).
const READER_USDC = process.env.READER_FUND_USDC ?? "0.2";

export type ProvisionedWallet = {
  address: `0x${string}`;
  privateKey: Hex;
};

/** Retry around nonce collisions when many readers are funded concurrently. */
async function withNonceRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const MAX = 5;
  for (let attempt = 0; attempt < MAX; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isNonce =
        msg.includes("replacement transaction underpriced") ||
        msg.includes("nonce too low") ||
        msg.includes("already known");
      if (!isNonce || attempt === MAX - 1) throw err;
      await new Promise((r) => setTimeout(r, 800 + attempt * 600));
      console.log(`[treasury] ${label}: nonce collision, retry ${attempt + 1}`);
    }
  }
  throw new Error("unreachable");
}

/**
 * Mint a fresh reader wallet, fund it from the treasury, and deposit into
 * Gateway so it can immediately pay for reads. Returns the wallet + key
 * (caller persists them in the `readers` table).
 */
export async function provisionReaderWallet(): Promise<
  ProvisionedWallet & { gatewayFunded: boolean }
> {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const treasury = walletClientFor(treasuryKey());

  // 1. Native USDC for gas.
  const gasTx = await withNonceRetry(
    () => treasury.sendTransaction({ to: account.address, value: GAS_FUND }),
    "gas",
  );
  await publicClient.waitForTransactionReceipt({ hash: gasTx });

  // 2. ERC-20 USDC to spend.
  const usdcTx = await withNonceRetry(
    () =>
      treasury.writeContract({
        address: ARC_TESTNET_USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [account.address, parseUnits(READER_USDC, 6)],
      }),
    "usdc",
  );
  await publicClient.waitForTransactionReceipt({ hash: usdcTx });

  // 3. Deposit into Circle Gateway so reads settle via batched authorizations.
  let gatewayFunded = false;
  try {
    const gateway = new GatewayClient({ chain: "arcTestnet", privateKey });
    await gateway.deposit(READER_USDC);
    gatewayFunded = true;
  } catch (err) {
    console.error("[treasury] gateway deposit failed:", (err as Error).message);
  }

  return { address: account.address, privateKey, gatewayFunded };
}

/**
 * Pay for a protected resource on behalf of a reader, using their custodial key.
 * Returns the settled response data (the unlocked content), amount, and tx hash.
 */
export async function payAsReader<T = unknown>(
  privateKey: Hex,
  url: string,
  init?: { method?: "GET" | "POST"; body?: Record<string, unknown> },
): Promise<{ data: T; formattedAmount: string; transaction: string; status: number }> {
  const gateway = new GatewayClient({ chain: "arcTestnet", privateKey });
  const result = await gateway.pay<T>(url, {
    method: init?.method ?? "GET",
    body: init?.body,
  });
  return {
    data: result.data,
    formattedAmount: result.formattedAmount,
    transaction: result.transaction,
    status: result.status,
  };
}

/** Read a custodial wallet's current Gateway + wallet balances. */
export async function readerBalances(privateKey: Hex) {
  const gateway = new GatewayClient({ chain: "arcTestnet", privateKey });
  return gateway.getBalances();
}

/**
 * Ensure a reader wallet holds enough native gas for an on-chain action
 * (Gateway deposit/approval). Signup funds gas once; a citizen who later
 * tops up from the faucet may have spent it. Tops up from the treasury
 * when the balance dips below half the standard grant.
 */
export async function ensureGas(privateKey: Hex): Promise<void> {
  const account = privateKeyToAccount(privateKey);
  const balance = await publicClient.getBalance({ address: account.address });
  if (balance >= GAS_FUND / BigInt(2)) return;
  const treasury = walletClientFor(treasuryKey());
  const tx = await withNonceRetry(
    () => treasury.sendTransaction({ to: account.address, value: GAS_FUND }),
    "gas-topup",
  );
  await publicClient.waitForTransactionReceipt({ hash: tx });
}

/** Withdraw USDC from a citizen's Gateway balance to an external address. */
export async function withdrawFromGateway(
  privateKey: Hex,
  amount: string,
  recipient: `0x${string}`,
) {
  const gateway = new GatewayClient({ chain: "arcTestnet", privateKey });
  return gateway.withdraw(amount, { chain: "arcTestnet", recipient });
}

/**
 * Deposit loose wallet USDC into Circle Gateway so it becomes spendable
 * (and withdrawable). Returns the deposit result including the tx hash.
 */
export async function depositToGateway(privateKey: Hex, amount: string) {
  const gateway = new GatewayClient({ chain: "arcTestnet", privateKey });
  return gateway.deposit(amount);
}

/**
 * Send ERC-20 USDC from the treasury to an address - used to pay a patron
 * their referral cut. Returns the tx hash. Amount is a decimal string.
 */
export async function payFromTreasury(to: `0x${string}`, amount: string): Promise<Hex> {
  const treasury = walletClientFor(treasuryKey());
  const tx = await withNonceRetry(
    () =>
      treasury.writeContract({
        address: ARC_TESTNET_USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, parseUnits(amount, 6)],
      }),
    "referral-payout",
  );
  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
}
