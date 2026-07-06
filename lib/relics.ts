/**
 * Scroll chapter relics - faint background artifacts that crossfade as the
 * landing narrative progresses (crier → floor → lepton → toll → ledger → forum).
 * Each theme has its own tinted asset set under /assets/relics/{theme}/.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ThemeKey } from "./theme";

export type RelicKey = "crier" | "floor" | "lepton" | "toll" | "ledger" | "forum";

export type Relic = {
  key: RelicKey;
  /** Tailwind positioning for the ghost artifact in the fixed layer */
  position: string;
  scale: number;
};

const KEYS: RelicKey[] = ["crier", "floor", "lepton", "toll", "ledger", "forum"];

export function relicImage(theme: ThemeKey, key: RelicKey): string {
  return `/assets/relics/${theme}/relic-${key}.png`;
}

export const RELICS: Relic[] = [
  {
    key: "crier",
    position: "left-[-2%] top-[6%] h-[min(70vh,620px)] w-[min(50vw,480px)]",
    scale: 1,
  },
  {
    key: "floor",
    position: "bottom-[4%] left-[-2%] h-[min(38vh,320px)] w-[min(96vw,960px)]",
    scale: 1.05,
  },
  {
    key: "lepton",
    position: "right-[4%] top-[34%] h-[min(40vh,360px)] w-[min(40vh,360px)]",
    scale: 1,
  },
  {
    key: "toll",
    position: "left-[-6%] top-[14%] h-[min(72vh,600px)] w-[min(36vw,320px)]",
    scale: 1,
  },
  {
    key: "ledger",
    position: "right-[-4%] top-[22%] h-[min(50vh,440px)] w-[min(50vw,460px)]",
    scale: 1.02,
  },
  {
    key: "forum",
    position: "left-[2%] top-[28%] h-[min(54vh,480px)] w-[min(46vw,420px)]",
    scale: 1,
  },
];

export const RELIC_BY_KEY = Object.fromEntries(RELICS.map((r) => [r.key, r])) as Record<
  RelicKey,
  Relic
>;

export { KEYS as RELIC_KEYS };
