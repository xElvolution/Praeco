/**
 * Clientela - a citizen's patronage network. In Rome a patron's clientes
 * brought him standing; here, inviting creators earns you a cut when they earn.
 * Invite link carries ?ref=<username>; the 10% cut lands when an invitee
 * subscribes to Pro. Stats are real (see referralStats).
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { REFERRAL_RATE } from "@/lib/pro";

export function ClientelaPanel({
  username,
  invited,
  active,
  rewards,
}: {
  username: string;
  invited: number;
  active: number;
  rewards: string;
}) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/citizen?ref=${username}`
      : `/citizen?ref=${username}`;

  function copy() {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    toast.success("Invite link copied.");
    setTimeout(() => setCopied(false), 1600);
  }

  const pct = Math.round(REFERRAL_RATE * 100);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <IconPatron />
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Clientela</h2>
            <p className="label-mono">your patronage</p>
          </div>
        </div>
        <span className="rounded-sm bg-primary/12 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
          {pct}% of Pro
        </span>
      </header>

      <div className="p-5">
        <p className="font-serif text-sm text-muted-foreground">
          Invite creators to Praeco. When someone you invited subscribes to Pro, you
          earn {pct}% of their fee - paid to your wallet, on-chain.
        </p>

        <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-border">
          <Stat v={String(invited)} l="invited" />
          <Stat v={String(active)} l="active" border />
          <Stat v={`$${Number(rewards).toFixed(3)}`} l="rewards" border accent />
        </div>

        <label className="label-mono mt-4 block">your invite link</label>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm bg-secondary px-3 py-2 font-mono text-xs text-ink">{link}</code>
          <button
            onClick={copy}
            className="shrink-0 rounded-sm bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {copied ? "✓ copied" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ v, l, border, accent }: { v: string; l: string; border?: boolean; accent?: boolean }) {
  return (
    <div className={`px-4 py-3.5 text-center ${border ? "border-l border-border" : ""}`}>
      <div className={`font-display text-2xl font-semibold tabular-nums ${accent ? "text-primary" : "text-ink"}`}>{v}</div>
      <div className="label-mono mt-0.5">{l}</div>
    </div>
  );
}

function IconPatron() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 14.3A5.5 5.5 0 0 1 20.5 19" />
    </svg>
  );
}
