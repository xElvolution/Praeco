/**
 * Client-side theme switching (persisted in localStorage, applied as a
 * data-attribute on <html> with no flash via the head script in layout).
 * SPDX-License-Identifier: Apache-2.0
 */
export const THEMES = [
  { key: "day", name: "Marble", note: "warm daylight stone" },
  { key: "papyrus", name: "Papyrus", note: "aged manuscript" },
  { key: "night", name: "Obsidian", note: "lamplit dark stone" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

export function applyTheme(key: ThemeKey) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = key;
  try {
    localStorage.setItem("praeco-theme", key);
  } catch {
    /* ignore */
  }
}

export function getTheme(): ThemeKey {
  if (typeof window === "undefined") return "day";
  try {
    return (localStorage.getItem("praeco-theme") as ThemeKey) || "day";
  } catch {
    return "day";
  }
}
