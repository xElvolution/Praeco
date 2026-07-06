/**
 * LedgerView - one surface, two faces behind a toggle: The Census (who leads)
 * and The Ledger (every payment as it settles). Both receive their server-
 * rendered initial data; switching is instant and client-side.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { Census } from "@/components/ledger/census";
import { LedgerFeed } from "@/components/ledger/ledger-feed";
import type { LeaderRow } from "@/lib/data";

type Read = Parameters<typeof LedgerFeed>[0]["initialReads"][number];
type Totals = Parameters<typeof LedgerFeed>[0]["initialTotals"];

export function LedgerView({
  census,
  reads,
  totals,
  viewer,
}: {
  census: LeaderRow[];
  reads: Read[];
  totals: Totals;
  viewer: string | null;
}) {
  const [face, setFace] = useState<"census" | "ledger">("census");

  return (
    <div>
      {/* The toggle */}
      <div className="flex gap-1.5 rounded-xl border border-border bg-secondary/30 p-1.5">
        <Face active={face === "census"} onClick={() => setFace("census")} label="The Census" sub="who leads" />
        <Face active={face === "ledger"} onClick={() => setFace("ledger")} label="The Ledger" sub="every payment" />
      </div>

      <div className="mt-5">
        {face === "census" ? (
          <Census initialRows={census} />
        ) : (
          <LedgerFeed initialReads={reads} initialTotals={totals} viewer={viewer} />
        )}
      </div>
    </div>
  );
}

function Face({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex-1 rounded-lg px-4 py-2.5 text-left transition-all ${
        active
          ? "bg-card ring-1 ring-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_6px_20px_-6px_hsl(var(--primary)/0.5)]"
          : "hover:bg-card/60"
      }`}
    >
      <span className={`font-display text-base font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span className="label-mono ml-2">{sub}</span>
    </button>
  );
}
