/**
 * Pro actions - subscribe (pay the fee from the citizen's wallet → grant Pro).
 * If the citizen was referred, their patron earns a cut (see Clientela).
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { currentCitizen } from "@/lib/auth";
import { payAsReader, payFromTreasury } from "@/lib/treasury";
import { setProUntil, getUserById, recordReferralEarning } from "@/lib/data";
import { PRO_DAYS, PRO_PRICE_USDC, REFERRAL_RATE } from "@/lib/pro";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export type SubscribeResult =
  | { ok: true; until: string; transaction: string }
  | { ok: false; error: string };

/**
 * If this citizen was referred, pay their patron a cut of the Pro fee from the
 * treasury and record it. Best-effort: a payout hiccup never blocks the
 * subscription the citizen already paid for.
 */
async function rewardReferrer(refereeId: string, referrerId: string) {
  try {
    const referrer = await getUserById(referrerId);
    if (!referrer?.wallet) return;
    const cut = (Number(PRO_PRICE_USDC) * REFERRAL_RATE).toFixed(6);
    let txHash: string | null = null;
    try {
      txHash = await payFromTreasury(referrer.wallet as `0x${string}`, cut);
    } catch (err) {
      console.error("[clientela] payout failed:", (err as Error).message);
    }
    await recordReferralEarning({ referrerId, refereeId, kind: "pro", amountUsdc: cut, txHash });
  } catch (err) {
    console.error("[clientela] reward error:", (err as Error).message);
  }
}

export async function subscribePro(): Promise<SubscribeResult> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };

  try {
    const paid = await payAsReader<{ ok: boolean }>(
      cit.privKey,
      `${BASE_URL}/api/pro`,
      { method: "GET" },
    );
    const until = new Date(Date.now() + PRO_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await setProUntil(cit.user.id, until);

    if (cit.user.referred_by) {
      await rewardReferrer(cit.user.id, cit.user.referred_by);
    }

    return { ok: true, until, transaction: paid.transaction };
  } catch (error) {
    return { ok: false, error: (error as Error).message.slice(0, 160) };
  }
}
