/**
 * Citizen status tiers - renown earned through reads given and received.
 * The laurel wreath grows fuller and brighter with rank.
 * SPDX-License-Identifier: Apache-2.0
 */
export type Tier = {
  key: string;
  name: string;
  min: number; // renown threshold
  leaves: number; // wreath fullness
  gold: string; // wreath colour
  image: string; // badge asset in /public/assets
};

export const TIERS: Tier[] = [
  { key: "plebeian", name: "Plebeian", min: 0, leaves: 0, gold: "#9a8a6a", image: "/assets/tiers/tier-plebeian.png" },
  { key: "citizen", name: "Citizen", min: 1, leaves: 5, gold: "#c79452", image: "/assets/tiers/tier-citizen.png" },
  { key: "patrician", name: "Patrician", min: 5, leaves: 8, gold: "#d8a64e", image: "/assets/tiers/tier-patrician.png" },
  { key: "senator", name: "Senator", min: 20, leaves: 11, gold: "#e6b84e", image: "/assets/tiers/tier-senator.png" },
  { key: "consul", name: "Consul", min: 50, leaves: 14, gold: "#f0c64e", image: "/assets/tiers/tier-consul.png" },
];

/** Coin-style herald mark - the praeco (crier), not the lepton (Λ) payment unit. */
export const PRAECO_MARK = "/assets/praeco-mark.png";

export function tierForRenown(renown: number): Tier {
  let t = TIERS[0];
  for (const tier of TIERS) if (renown >= tier.min) t = tier;
  return t;
}

/** Renown to the next tier, for progress UI (null at the top). */
export function nextTier(renown: number): Tier | null {
  return TIERS.find((t) => t.min > renown) ?? null;
}
