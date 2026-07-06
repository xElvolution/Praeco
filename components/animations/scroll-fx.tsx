/**
 * ScrollFX - GSAP ScrollTrigger effects driven by data-attributes:
 *   data-coin     → parallax drift + scale as you scroll the hero
 *   data-reveal   → rise + fade in when scrolled into view
 *   data-parallax → drift at a different rate (depth)
 * Render once inside a page; it wires the whole document.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useEffect } from "react";

export function ScrollFX() {
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // NOTE: nothing in the hero / first screen is scroll-driven - it must
        // render fully on load. Parallax applies only to lower-down elements.

        // Reveal-on-scroll for elements explicitly opted in (none in the hero).
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 44,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
          });
        });

        // Depth parallax for big chapter numerals lower in the page.
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const speed = Number(el.dataset.parallax || "30");
          gsap.to(el, {
            yPercent: -speed,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return null;
}
