/**
 * Arena actions - claim quests, bind a wallet, claim the daily treasure.
 * Renown awards are multiplied by active boosts (Pro 1.5×, socials 1.25×).
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { isAddress } from "viem";
import { currentCitizen } from "@/lib/auth";
import {
  citizenStats,
  claimQuest,
  bumpRenown,
  bindWallet,
  claimDailyTreasure,
  type User,
} from "@/lib/data";
import { QUESTS, DAILY_TREASURE_RENOWN, BOOSTS } from "@/lib/quests";
import { isPro } from "@/lib/pro";

function hasSocials(u: User) {
  return !!(u.twitter || u.email || u.discord);
}
function boost(u: User) {
  let m = 1;
  if (isPro(u)) m *= BOOSTS.pro;
  if (hasSocials(u)) m *= BOOSTS.socials;
  return m;
}

export async function claimQuestAction(key: string) {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  const quest = QUESTS.find((q) => q.key === key);
  if (!quest) return { ok: false, error: "Unknown quest." };

  const u = cit.user;
  let progress = 0;
  if (quest.metric === "wallet_bound") progress = u.bound_wallet ? 1 : 0;
  else if (quest.metric === "socials") progress = hasSocials(u) ? 1 : 0;
  else {
    const stats = await citizenStats(u.id, u.username);
    progress = stats[quest.metric] ?? 0;
  }
  if (progress < quest.goal) return { ok: false, error: "Not finished yet." };

  const newly = await claimQuest(u.id, key);
  if (!newly) return { ok: false, error: "Already claimed." };

  const award = Math.max(1, Math.round(quest.renown * boost(u)));
  await bumpRenown(u.id, award);
  return { ok: true, award };
}

export async function bindWalletAction(address: string) {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  if (!isAddress(address)) return { ok: false, error: "Invalid wallet address." };
  await bindWallet(cit.user.id, address);
  return { ok: true };
}

export async function claimDailyAction() {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };

  const hit = await claimDailyTreasure(cit.user.id);
  if (!hit) return { ok: false, error: "Already claimed today." };

  const award = Math.max(1, Math.round(DAILY_TREASURE_RENOWN * boost(cit.user)));
  await bumpRenown(cit.user.id, award);
  return { ok: true, award, streak: hit.streak };
}
