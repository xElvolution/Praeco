/**
 * The Golden Relic - a citizen's secret, styled as an ancient inscription.
 * Latin words + Greek words + a Roman numeral, chosen from cryptographic
 * randomness. The relic is the only key to a citizen's vault.
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomBytes } from "node:crypto";

const LATIN = [
  "CALIX", "NOCTIS", "AQVILA", "CORVVS", "IGNIS", "VENTVS", "LVPVS", "MARE",
  "AVRVM", "FERRVM", "LAVRVS", "GLADIVS", "SCVTVM", "TEMPVS", "FLVMEN", "MONS",
  "SILVA", "STELLA", "VRBS", "PORTA", "TVRRIS", "VIA", "PAX", "BELLVM",
  "REX", "DEVS", "FATVM", "VMBRA", "LVX", "SAL", "PANIS", "VINVM",
];
const GREEK = [
  "ΛΕΠΤΟΝ", "ΑΛΦΑ", "ΩΜΕΓΑ", "ΔΕΛΤΑ", "ΣΙΓΜΑ", "ΦΟΙΝΙΞ", "ΛΟΓΟΣ", "ΚΟΣΜΟΣ",
  "ΧΑΟΣ", "ΜΟΙΡΑ", "ΝΙΚΗ", "ΨΥΧΗ", "ΑΡΧΗ", "ΤΕΛΟΣ", "ΑΙΘΗΡ", "ΗΛΙΟΣ",
];
const ROMAN_UNITS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const ROMAN_TENS = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];

function pick<T>(arr: T[], byte: number): T {
  return arr[byte % arr.length];
}

function numeral(byte: number): string {
  const n = (byte % 99) + 1;
  return (ROMAN_TENS[Math.floor(n / 10)] + ROMAN_UNITS[n % 10]) || "I";
}

/**
 * Forge a relic, e.g. "AQVILA·ΛΕΠΤΟΝ·CORVVS·XLVII·ΔΕΛΤΑ·IGNIS".
 * Six inscribed segments mixing Latin, Greek, and a numeral.
 */
export function forgeRelic(): string {
  const b = randomBytes(8);
  return [
    pick(LATIN, b[0]),
    pick(GREEK, b[1]),
    pick(LATIN, b[2]),
    numeral(b[3]),
    pick(GREEK, b[4]),
    pick(LATIN, b[5]),
  ].join("·");
}

/** Normalize a typed relic for comparison (uppercase, collapse separators). */
export function normalizeRelic(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]+/g, "·")
    .replace(/·+/g, "·")
    .replace(/^·|·$/g, "");
}
