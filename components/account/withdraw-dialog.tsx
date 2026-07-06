/**
 * WithdrawDialog - cash spendable USDC out of the Fiscus to an external wallet.
 * Mirrors DepositDialog so the purse's two actions read as a matched pair.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { withdrawUsdc } from "@/app/account-actions";
import { explorerTx } from "@/lib/arc";

export function WithdrawDialog({ available }: { available: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const max = Number(available);

  async function go() {
    setBusy(true);
    const res = await withdrawUsdc(amount, dest);
    setBusy(false);
    if (res.ok) {
      setDone(res.txHash);
      toast.success(`Withdrew ${res.amount} USDC.`);
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          disabled={max <= 0}
          className="flex-1 rounded-sm border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↗ Withdraw
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Withdraw from your Fiscus</DialogTitle>
          <DialogDescription className="font-serif">
            Send your spendable USDC to any wallet on Arc. Settles instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="label-mono">amount</span>
            <button
              onClick={() => setAmount(available)}
              className="font-mono text-xs text-primary hover:underline"
            >
              max ${max.toFixed(4)}
            </button>
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 font-mono text-lg text-ink outline-none focus:border-primary"
          />

          <label className="label-mono mt-4 block">destination wallet</label>
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="0x…"
            className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-primary"
          />

          <button
            onClick={go}
            disabled={busy || !amount || !dest || Number(amount) <= 0}
            className="mt-4 w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Withdraw"}
          </button>

          {done && (
            <a
              href={explorerTx(done)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-center font-mono text-xs text-primary hover:underline"
            >
              view withdrawal on arcscan ↗
            </a>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Gateway charges a small network fee - withdraw once it&apos;s worth clearing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
