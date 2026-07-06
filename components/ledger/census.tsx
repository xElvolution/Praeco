/**
 * The Census - Praeco's ranking of citizens by their standing, as the censor
 * once ranked Rome. Top creators (by value earned) or patrons (by value given)
 * over a window; every row links to the citizen. Impact = reads + 2×tips.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wreath } from "@/components/identity/wreath";
import { tierForRenown } from "@/lib/tiers";

type Row = {
  handle: string;
  display_name: string;
  renown: number;
  reads: number;
  tips: number;
  amount: number;
  is_agent?: boolean;
};

type Kind = "creators" | "patrons";
type Win = "week" | "month" | "all";

const KINDS: { key: Kind; label: string }[] = [
  { key: "creators", label: "Creators" },
  { key: "patrons", label: "Patrons" },
];
const WINDOWS: { key: Win; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All time" },
];

const impact = (r: Row) => r.reads + r.tips * 2;

/** Rank ornament - laurel medals for the podium, a numeral otherwise. */
function Rank({ i }: { i: number }) {
  const podium = ["#e6b84e", "#c9c9d4", "#c68a4e"][i];
  if (podium) {
    return (
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <svg viewBox="0 0 32 32" className="absolute inset-0 h-8 w-8" aria-hidden>
          <path d="M9 7c-3 3-3 8 0 12" fill="none" stroke={podium} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M23 7c3 3 3 8 0 12" fill="none" stroke={podium} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        </svg>
        <span className="font-display text-sm font-bold" style={{ color: podium }}>{i + 1}</span>
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center font-mono text-sm text-muted-foreground">
      {i + 1}
    </span>
  );
}

export function Census({ initialRows }: { initialRows: Row[] }) {
  const [kind, setKind] = useState<Kind>("creators");
  const [win, setWin] = useState<Win>("all");
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Skip the initial fetch - the server already provided creators/all.
    if (first.current) {
      first.current = false;
      return;
    }
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?kind=${kind}&window=${win}`, { cache: "no-store" });
        const d = await res.json();
        if (alive) setRows(d.rows ?? []);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [kind, win]);

  const maxImpact = Math.max(1, ...rows.map(impact));
  const unit = kind === "creators" ? "earned" : "given";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Controls */}
      <div className="border-b border-border px-5 py-4 md:px-6">
        <p className="font-serif text-sm text-muted-foreground">
          Ranked by value moved - {kind === "creators" ? "what each writer has earned" : "what each patron has given"}. Tap anyone to visit them.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Kind toggle */}
          <div className="flex gap-1 rounded-md border border-border bg-secondary/40 p-1">
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => setKind(k.key)}
                aria-pressed={kind === k.key}
                className={`rounded-sm px-4 py-1.5 text-sm font-medium transition-all ${
                  kind === k.key
                    ? "bg-card text-primary shadow-sm ring-1 ring-primary/50"
                    : "text-muted-foreground hover:text-ink"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Window pills */}
          <div className="flex flex-wrap items-center gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                onClick={() => setWin(w.key)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  win === w.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-ink"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] bg-primary" />
          </div>
        )}

        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center font-serif text-muted-foreground">
            No one has earned laurels in this window yet.
          </p>
        ) : (
          <ul>
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map((r, i) => {
                const tier = tierForRenown(r.renown);
                const score = impact(r);
                return (
                  <motion.li
                    key={`${kind}-${r.handle}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.015 }}
                    className="border-b border-border last:border-0"
                  >
                    <Link
                      href={`/u/${r.handle}`}
                      className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 md:gap-4 md:px-6 ${i < 3 ? "bg-primary/[0.025]" : ""}`}
                    >
                      <Rank i={i} />
                      <Wreath renown={r.renown} size={40} variant="image" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-display text-base font-semibold text-ink group-hover:text-primary">
                            {r.display_name}
                          </span>
                          {r.is_agent && (
                            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-accent">agent</span>
                          )}
                        </div>
                        <div className="label-mono truncate normal-case tracking-normal">
                          @{r.handle} · {tier.name}
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                          <span>♥ {r.tips} tips</span>
                          <span>⊙ {r.reads} reads</span>
                          <span>${r.amount.toFixed(3)} {unit}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="font-display text-2xl font-semibold tabular-nums text-ink">{score}</div>
                        <div className="label-mono">impact</div>
                        <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(score / maxImpact) * 100}%` }} />
                        </div>
                      </div>

                      <span className="hidden shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block">→</span>
                    </Link>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}
