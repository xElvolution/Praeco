/**
 * ScrollRelics - faint fixed background artifacts that crossfade as the user
 * scrolls through landing chapters marked with data-relic.
 * Portaled to <body> so z-index sits above Atmosphere, below page content.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import { RELICS, relicImage, type RelicKey } from "@/lib/relics";
import { getTheme, type ThemeKey } from "@/lib/theme";

function relicInView(): RelicKey {
  const sections = document.querySelectorAll<HTMLElement>("[data-relic]");
  const mid = window.innerHeight * 0.46;
  let best: RelicKey = "crier";
  let bestDist = Infinity;

  for (const el of sections) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const dist = Math.abs(r.top + r.height / 2 - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = el.dataset.relic as RelicKey;
    }
  }
  return best;
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function themeSnapshot(): ThemeKey {
  return getTheme();
}

export function ScrollRelics() {
  const [active, setActive] = useState<RelicKey>("crier");
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, () => "day" as ThemeKey);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      const next = relicInView();
      setActive((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("praeco:scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("praeco:scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {RELICS.map((relic) => {
        const on = active === relic.key;
        return (
          <div
            key={relic.key}
            className={`absolute transition-opacity duration-[1.4s] ease-out ${relic.position} ${
              on ? "opacity-100" : "opacity-0"
            }`}
            style={{ transform: `scale(${relic.scale})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`${theme}-${relic.key}`}
              src={relicImage(theme, relic.key)}
              alt=""
              className="h-full w-full object-contain object-center"
              draggable={false}
            />
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
