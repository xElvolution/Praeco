/**
 * Tip amounts - the canonical whitelist. Used by the /api/tip route to reject
 * anything unexpected, and by the reader UI to render the buttons. Keeping
 * both in sync avoids the "UI shows $0.50, API rejects '0.50'" class of bug.
 * SPDX-License-Identifier: Apache-2.0
 */

export const TIP_AMOUNTS = ["0.05", "0.25", "1"] as const;

export type TipAmount = (typeof TIP_AMOUNTS)[number];

const ALLOWED = new Set<string>(TIP_AMOUNTS);

export function isTipAmount(x: string): x is TipAmount {
  return ALLOWED.has(x);
}
