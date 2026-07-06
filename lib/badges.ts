/**
 * Laurels - the badges a citizen collects. Two kinds, both derived from real
 * state (no separate award table): rank laurels earned by crossing a tier's
 * renown threshold, and duty seals earned by claiming a quest in the Arena.
 * SPDX-License-Identifier: Apache-2.0
 */
import { TIERS } from "./tiers";
import { QUESTS } from "./quests";

export type Badge = {
  key: string;
  name: string;
  detail: string;
  kind: "rank" | "duty";
  image?: string; // rank laurels use the wreath art
  earned: boolean;
};

/** All laurels for a citizen, earned + locked, ranks first then duties. */
export function badgesFor(renown: number, claimedQuests: Set<string>): Badge[] {
  const rank: Badge[] = TIERS.filter((t) => t.min > 0).map((t) => ({
    key: `rank:${t.key}`,
    name: t.name,
    detail: `Reach ${t.min} renown`,
    kind: "rank",
    image: t.image,
    earned: renown >= t.min,
  }));

  const duty: Badge[] = QUESTS.map((q) => ({
    key: `duty:${q.key}`,
    name: q.title,
    detail: q.detail,
    kind: "duty",
    earned: claimedQuests.has(q.key),
  }));

  return [...rank, ...duty];
}
