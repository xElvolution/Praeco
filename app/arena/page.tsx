/**
 * The Arena - the cursus honorum made playable. A citizen climbs the ranks by
 * earning renown: reading, publishing, tipping, gathering a following. Every
 * quest is measured against real on-platform activity, never mocked. The old
 * "how it works" explainer is folded in here, "explained in the quest".
 * SPDX-License-Identifier: Apache-2.0
 */
import { Nav } from "@/components/site/nav";
import { ArenaClient } from "@/components/arena/arena-client";
import { currentUser } from "@/lib/auth";
import { citizenStats, claimedQuests, claimedDailyToday } from "@/lib/data";
import { QUESTS, DAILY_TREASURE_RENOWN, BOOSTS } from "@/lib/quests";
import { isPro } from "@/lib/pro";
import { TIERS, tierForRenown, nextTier } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Arena · Praeco",
  description: "Climb the cursus honorum. Earn renown, raise your rank, wear your laurel.",
};

export default async function ArenaPage() {
  const user = await currentUser();

  // Tier ladder is public - the same data drives the guest preview.
  const ladder = TIERS.map((t) => ({
    key: t.key,
    name: t.name,
    min: t.min,
    image: t.image,
    gold: t.gold,
  }));

  if (!user) {
    return (
      <div className="min-h-screen">
        <Nav />
        <ArenaClient guest ladder={ladder} />
      </div>
    );
  }

  const stats = await citizenStats(user.id, user.username);
  const claimed = new Set(await claimedQuests(user.id));

  const hasSocials = !!(user.twitter || user.email || user.discord);
  const pro = isPro(user);
  let mult = 1;
  if (pro) mult *= BOOSTS.pro;
  if (hasSocials) mult *= BOOSTS.socials;
  const award = (renown: number) => Math.max(1, Math.round(renown * mult));

  const progressFor = (q: (typeof QUESTS)[number]): number => {
    if (q.metric === "wallet_bound") return user.bound_wallet ? 1 : 0;
    if (q.metric === "socials") return hasSocials ? 1 : 0;
    return stats[q.metric] ?? 0;
  };

  const quests = QUESTS.map((q) => {
    const progress = Math.min(progressFor(q), q.goal);
    return {
      key: q.key,
      title: q.title,
      detail: q.detail,
      renown: q.renown,
      goal: q.goal,
      metric: q.metric,
      progress,
      done: progress >= q.goal,
      claimed: claimed.has(q.key),
      award: award(q.renown),
      // where the Eagle's duty sends you to finish it
      href:
        q.metric === "pieces"
          ? "/studio"
          : q.metric === "subscribers"
            ? "/me"
            : q.metric === "socials"
              ? "/settings"
              : q.metric === "wallet_bound"
                ? null
                : "/read",
    };
  });

  const claimedToday = await claimedDailyToday(user.id);
  const daily = {
    streak: user.streak ?? 0,
    claimedToday,
    award: award(DAILY_TREASURE_RENOWN),
  };

  const tier = tierForRenown(user.renown);
  const next = nextTier(user.renown);

  const citizen = {
    username: user.username,
    displayName: user.display_name,
    renown: user.renown,
    boundWallet: user.bound_wallet,
    tier: { key: tier.key, name: tier.name, image: tier.image, gold: tier.gold, min: tier.min },
    next: next ? { name: next.name, min: next.min } : null,
    boosts: { pro, socials: hasSocials, mult },
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <ArenaClient
        ladder={ladder}
        citizen={citizen}
        quests={quests}
        daily={daily}
      />
    </div>
  );
}
