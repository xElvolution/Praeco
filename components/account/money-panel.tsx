/**
 * MoneyPanel - the citizen's money, split into two toggled faces:
 *   Fiscus   · the purse: spendable balance, deposit, withdraw, wallet.
 *   Aerarium · the earnings: what the work brought in.
 * A segmented toggle swaps between them so they don't stack down the page.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { DepositDialog } from "@/components/account/deposit-dialog";
import { WithdrawDialog } from "@/components/account/withdraw-dialog";
import { Info } from "@/components/ui/info";

type Props = {
  wallet: string;
  explorerHref: string;
  spendable: string;
  loose: string;
  totalEarned: number;
  tips: string;
  reads: number;
  subscribers: number;
};

export function MoneyPanel(props: Props) {
  const [face, setFace] = useState<"fiscus" | "aerarium">("fiscus");

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      {/* Segmented toggle */}
      <div className="flex items-center gap-1 border-b border-border bg-secondary/30 p-1.5">
        <ToggleTab active={face === "fiscus"} onClick={() => setFace("fiscus")} label="Fiscus" sub="purse" />
        <ToggleTab active={face === "aerarium"} onClick={() => setFace("aerarium")} label="Aerarium" sub="earnings" />
      </div>

      {face === "fiscus" ? (
        <FiscusFace {...props} />
      ) : (
        <AerariumFace {...props} />
      )}
    </div>
  );
}

function ToggleTab({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex-1 rounded-md px-4 py-2.5 text-left transition-all ${
        active
          ? "bg-card ring-1 ring-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_4px_18px_-4px_hsl(var(--primary)/0.5)]"
          : "hover:bg-card/60"
      }`}
    >
      <span className={`font-display text-base font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      <span className="label-mono ml-2">{sub}</span>
      {active && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

function FiscusFace({ wallet, explorerHref, spendable, loose }: Props) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-1">
        <span className="label-mono">spendable balance</span>
        <Info text="Fiscus was the Roman imperial purse. Here it's USDC in Circle Gateway - money you deposit, spend on reads, and withdraw." />
      </div>
      <div className="mt-1 font-display text-4xl font-semibold tabular-nums text-primary">
        ${Number(spendable).toFixed(4)}
      </div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">
        + ${Number(loose).toFixed(4)} in wallet, not yet spendable
      </div>

      <div className="mt-5 flex gap-2">
        <DepositDialog address={wallet} loose={loose} />
        <WithdrawDialog available={spendable} />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <span className="label-mono shrink-0">wallet</span>
        <code className="min-w-0 flex-1 truncate rounded-sm bg-secondary px-3 py-2 font-mono text-xs text-ink">{wallet}</code>
        <a href={explorerHref} target="_blank" rel="noreferrer" className="shrink-0 rounded-sm border border-border px-3 py-2 text-xs text-ink transition-colors hover:bg-secondary">explorer ↗</a>
      </div>
    </div>
  );
}

function AerariumFace({ totalEarned, tips, reads, subscribers }: Props) {
  const stats = [
    { v: `$${totalEarned.toFixed(3)}`, l: "total earned" },
    { v: `$${Number(tips || 0).toFixed(3)}`, l: "tips received" },
    { v: String(reads), l: "reads" },
    { v: String(subscribers), l: "subscribers" },
  ];
  return (
    <div>
      <div className="flex items-center gap-1 px-5 pt-4">
        <span className="label-mono">what your work earned</span>
        <Info text="Aerarium was Rome's public treasury. Here it's the revenue your pieces have brought in, all-time." />
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.l}
            className={`px-5 py-4 ${i % 2 === 1 ? "border-l border-border" : ""} ${i >= 2 ? "border-t border-border" : ""} sm:border-t-0 ${i >= 1 ? "sm:border-l" : ""}`}
          >
            <div className="font-display text-xl font-semibold tabular-nums text-ink">{s.v}</div>
            <div className="label-mono mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
