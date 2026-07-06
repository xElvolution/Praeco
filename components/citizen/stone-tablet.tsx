/**
 * StoneTablet - the Golden Relic carved into stone, gold leaf filling the
 * grooves segment by segment. The signup ritual's centerpiece.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { motion } from "framer-motion";

export function StoneTablet({ relic }: { relic: string }) {
  const segments = relic.split("·");
  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-md border border-[#1c1813] p-8 shadow-[inset_0_2px_18px_rgba(0,0,0,0.7),0_10px_40px_rgba(0,0,0,0.25)]"
        style={{
          background:
            "linear-gradient(150deg,#3a342b 0%,#2b2620 45%,#221e19 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-2 rounded-sm border border-[#000]/40 shadow-[inset_0_0_0_1px_rgba(255,220,150,0.04)]" />

        <p className="mb-4 text-center font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[#b79a5e]/70">
          the golden relic
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {segments.map((seg, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6, filter: "brightness(0.2)" }}
              animate={{ opacity: 1, y: 0, filter: "brightness(1)" }}
              transition={{ delay: 0.25 + i * 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-2xl font-semibold sm:text-3xl"
              style={{
                backgroundImage:
                  "linear-gradient(180deg,#f6e3a8 0%,#e7c46a 40%,#b8893c 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 1px 0 rgba(0,0,0,0.6)",
              }}
            >
              {seg}
              {i < segments.length - 1 && <span className="ml-3 text-[#7a6a44]">·</span>}
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ delay: 0.25 + segments.length * 0.45 + 0.2, duration: 1.1, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12"
          style={{
            background:
              "linear-gradient(90deg,transparent,rgba(255,235,180,0.18),transparent)",
          }}
        />
      </div>
    </div>
  );
}
