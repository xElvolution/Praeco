/**
 * The Ledger - a live feed of every paid read, each line an inscription being
 * carved. Handles link to citizen profiles (the user map). A signed-in citizen
 * can switch to "Mine" to see only their own reads. Polls sparingly; pauses
 * when the tab is hidden.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wreath } from "@/components/identity/wreath";

type Read = {
  id: string;
  created_at: string;
  article_title: string;
  creator_handle: string;
  reader_handle: string;
  reader_wallet: string;
  amount_usdc: string;
  gateway_tx: string | null;
  is_agent: boolean;
  is_tip?: boolean;
  creator_renown?: number;
  reader_renown?: number;
};
type Totals = {
  total_reads: number;
  total_usdc: string;
  unique_readers: number;
  creators_paid: number;
};

/** Poll interval - keep modest; each hit queries Neon. */
const POLL_MS = 20_000;

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/** A handle rendered as a link to the citizen's profile (or plain for agents). */
function Handle({ name, renown, agent, highlight }: { name: string; renown?: number; agent?: boolean; highlight?: boolean }) {
  const label = <span className={`font-medium ${highlight ? "text-primary" : ""}`}>{name}</span>;
  if (agent) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">agent</span>
        {label}
      </span>
    );
  }
  return (
    <Link href={`/u/${name}`} className="inline-flex items-center gap-1 hover:underline">
      <Wreath renown={renown ?? 0} size={16} />
      {label}
    </Link>
  );
}

export function LedgerFeed({
  initialReads,
  initialTotals,
  viewer = null,
  limit,
}: {
  initialReads: Read[];
  initialTotals: Totals;
  viewer?: string | null;
  /** Cap the visible rows (landing shows a taste; /ledger shows the carving in full). */
  limit?: number;
}) {
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [reads, setReads] = useState<Read[]>(initialReads);
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [loadingMine, setLoadingMine] = useState(false);
  const inflight = useRef(false);

  const fetchScope = useCallback(async (s: "all" | "mine") => {
    if (inflight.current || document.hidden) return;
    inflight.current = true;
    if (s === "mine") setLoadingMine(true);
    try {
      const res = await fetch(`/api/ledger${s === "mine" ? "?scope=mine" : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { reads: Read[]; totals: Totals | null };
      setReads(data.reads);
      if (data.totals) setTotals(data.totals);
    } catch {
      /* transient - keep last good state */
    } finally {
      inflight.current = false;
      setLoadingMine(false);
    }
  }, []);

  // Re-fetch immediately when switching scope.
  useEffect(() => {
    void fetchScope(scope);
  }, [scope, fetchScope]);

  // Poll the active scope.
  useEffect(() => {
    const tick = () => void fetchScope(scope);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [scope, fetchScope]);

  const usdc = Number(totals.total_usdc || 0);
  const shown = limit ? reads.slice(0, limit) : reads;
  const hidden = limit ? Math.max(0, totals.total_reads - limit) : 0;

  return (
    <div>
      {/* Totals */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
        {[
          { v: String(totals.total_reads), l: "reads paid" },
          { v: `$${usdc.toFixed(4)}`, l: "USDC moved" },
          { v: String(totals.creators_paid), l: "creators paid" },
          { v: String(totals.unique_readers), l: "readers" },
        ].map((s) => (
          <div key={s.l} className="bg-card px-5 py-4">
            <div className="font-display text-2xl font-semibold tabular-nums text-ink">{s.v}</div>
            <div className="label-mono mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Scope tabs + live indicator */}
      <div className="mt-6 flex items-center justify-between">
        {viewer ? (
          <div className="flex gap-1 rounded-md border border-border bg-secondary/30 p-1">
            {(["all", "mine"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-sm px-3.5 py-1.5 text-sm transition-colors ${scope === s ? "bg-card font-medium text-ink shadow-sm" : "text-muted-foreground hover:text-ink"}`}
              >
                {s === "all" ? "All" : "Mine"}
              </button>
            ))}
          </div>
        ) : (
          <span className="label-mono">the carving</span>
        )}
        <span className="flex items-center gap-2 label-mono">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-patina" />
          settling on Arc
        </span>
      </div>

      {/* Feed */}
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
        {reads.length === 0 ? (
          <p className="px-5 py-10 text-center font-serif text-muted-foreground">
            {loadingMine
              ? "Loading your ledger…"
              : scope === "mine"
                ? "You have no reads yet - pay for a piece or get read, and it appears here."
                : "No reads yet. The ledger fills as people pay."}
          </p>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {shown.map((r) => {
                const mineRow = !!viewer && (r.reader_handle === viewer || r.creator_handle === viewer);
                return (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, backgroundColor: "rgba(176,141,87,0.18)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 1.2 }}
                    className={`flex items-center justify-between gap-4 border-b border-border px-5 py-3 last:border-0 ${mineRow ? "border-l-2 border-l-primary pl-[18px]" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1 font-serif text-ink">
                        <Handle name={r.reader_handle} renown={r.reader_renown} agent={r.is_agent} highlight={r.reader_handle === viewer} />
                        <span className="text-muted-foreground">{r.is_tip ? "tipped" : "paid"}</span>
                        <Handle name={r.creator_handle} renown={r.creator_renown} highlight={r.creator_handle === viewer} />
                      </p>
                      <p className="truncate label-mono mt-0.5">
                        {r.article_title} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm tabular-nums text-ink">
                        ⊙ ${Number(r.amount_usdc).toFixed(3)}
                      </div>
                      {r.gateway_tx && (
                        <div className="label-mono">{r.gateway_tx.slice(0, 8)}…</div>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
        {limit && hidden > 0 && (
          <Link
            href="/ledger"
            className="flex items-center justify-center gap-2 border-t border-border bg-secondary/30 px-5 py-3 text-sm text-primary transition-colors hover:bg-secondary/60"
          >
            <span className="font-serif">See the full ledger</span>
            <span className="label-mono">+{hidden} more</span>
          </Link>
        )}
      </div>
    </div>
  );
}
