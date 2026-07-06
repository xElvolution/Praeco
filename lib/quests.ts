/**
 * The Cursus Honorum - quests that earn renown and carry a citizen up the ranks
 * (Citizen → Quaestor → ... → Consul). Each quest is checked against real
 * activity (reads given, pieces published, tips, subscribers, wallet bound).
 * SPDX-License-Identifier: Apache-2.0
 */
export type Quest = {
  key: string;
  title: string;
  detail: string;
  renown: number;
  /** how to measure progress; evaluated server-side from the citizen's stats */
  metric: "reads_given" | "pieces" | "tips_given" | "subscribers" | "wallet_bound" | "socials";
  goal: number;
};

export const QUESTS: Quest[] = [
  { key: "first_read", title: "Pay your first lepton", detail: "Read any piece. The toll goes straight to the writer.", renown: 1, metric: "reads_given", goal: 1 },
  { key: "five_reads", title: "Patron of the forum", detail: "Pay for 5 reads.", renown: 3, metric: "reads_given", goal: 5 },
  { key: "first_tip", title: "Reward a voice", detail: "Tip a writer on top of a read.", renown: 2, metric: "tips_given", goal: 1 },
  { key: "first_publish", title: "Take the rostrum", detail: "Publish your first piece.", renown: 3, metric: "pieces", goal: 1 },
  { key: "first_subscriber", title: "Gather a following", detail: "Earn your first subscriber.", renown: 4, metric: "subscribers", goal: 1 },
  { key: "bind_wallet", title: "Swear by your seal", detail: "Bind your own wallet to your citizenship.", renown: 3, metric: "wallet_bound", goal: 1 },
  { key: "connect_socials", title: "Be known abroad", detail: "Add a social link to your profile.", renown: 2, metric: "socials", goal: 1 },
];

/** Daily quests - reset each day; completing all claims the daily treasure. */
export const DAILY = [
  { key: "daily_read", title: "Read a piece today", metric: "reads_given" as const },
  { key: "daily_like", title: "Like a piece today", metric: "likes_given" as const },
  { key: "daily_streak", title: "Return tomorrow", metric: "streak" as const },
];

export const DAILY_TREASURE_RENOWN = 2;

/** Boost multipliers applied to renown earned. */
export const BOOSTS = {
  pro: 1.5,
  socials: 1.25,
} as const;
