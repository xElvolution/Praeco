/**
 * Praeco Pro - a paid tier that unlocks the AI writing tools with a daily cap.
 * SPDX-License-Identifier: Apache-2.0
 */
// Testnet demo price so Pro is payable from the small starter balance without a
// top-up. Set to "5" for the real $5/month production price.
export const PRO_PRICE_USDC = "0.1";
/** Free citizens get a few AI co-writer assists a day; Pro unlocks many more. */
export const FREE_DAILY_AI = 10;
export const PRO_DAILY_AI = 100;
export const PRO_DAYS = 30;

/** The daily AI-assist cap for a given citizen (free vs Pro). */
export function aiLimitFor(user: { pro_until: string | null }): number {
  return isPro(user) ? PRO_DAILY_AI : FREE_DAILY_AI;
}

/** A patron earns this share of a Pro fee paid by a citizen they referred. */
export const REFERRAL_RATE = 0.1;

export function isPro(user: { pro_until: string | null }): boolean {
  return !!user.pro_until && new Date(user.pro_until).getTime() > Date.now();
}
