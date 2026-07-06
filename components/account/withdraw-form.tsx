/**
 * Withdraw form - cash a citizen's Gateway balance out to an external wallet.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { withdrawUsdc } from "@/app/account-actions";
import { explorerTx } from "@/lib/arc";

export function WithdrawForm({ available }: { available: string }) {
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    const res = await withdrawUsdc(amount, dest);
    setBusy(false);
    if (res.ok) {
      setDone(res.txHash);
      toast.success(`Withdrew ${res.amount} USDC.`);
    } else toast.error(res.error);
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="label-mono mb-2">withdraw earnings</div>
      <p className="font-serif text-sm text-muted-foreground">
        Send your spendable USDC (${Number(available).toFixed(3)}) to any wallet on Arc.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="amount"
          className="w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary sm:w-28"
        />
        <input
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="0x destination address"
          className="min-w-0 flex-1 rounded-sm border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
        />
        <button
          onClick={go}
          disabled={busy || !amount || !dest}
          className="rounded-sm bg-primary px-5 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Withdraw"}
        </button>
      </div>
      {done && (
        <p className="mt-3 font-mono text-xs text-patina">
          ✓ sent ·{" "}
          <a href={explorerTx(done)} target="_blank" rel="noreferrer" className="underline hover:text-ink">
            {done.slice(0, 12)}…
          </a>
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Note: Gateway charges a network fee, so withdraw once you&apos;ve accrued enough to clear it.
      </p>
    </div>
  );
}
