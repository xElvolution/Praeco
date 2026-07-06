/**
 * DepositDialog - add funds to the Fiscus. Two honest paths on testnet:
 *  1. Receive: send USDC to your Praeco wallet address (shown + QR + copy).
 *  2. Move to spendable: sweep loose wallet USDC into Circle Gateway so it can
 *     be spent on reads and withdrawn. Provable on arcscan.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sweepToGateway } from "@/app/account-actions";
import { explorerTx } from "@/lib/arc";
import { useRouter } from "next/navigation";

export function DepositDialog({ address, loose }: { address: string; loose: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const hasLoose = Number(loose) > 0;

  function copy() {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    toast.success("Address copied.");
    setTimeout(() => setCopied(false), 1600);
  }

  async function move() {
    setBusy(true);
    const res = await sweepToGateway();
    setBusy(false);
    if (res.ok) {
      setTx(res.txHash);
      toast.success(`Moved ${res.amount} USDC to spendable.`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
          + Deposit
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add to your Fiscus</DialogTitle>
          <DialogDescription className="font-serif">
            Send test USDC to your wallet, then move it into your spendable balance.
          </DialogDescription>
        </DialogHeader>

        {/* Receive */}
        <div className="mt-2 rounded-md border border-border bg-card p-5">
          <div className="label-mono mb-3">1 · receive</div>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-md bg-[#f4ecd8] p-3 ring-1 ring-border">
              <QRCodeSVG value={address} size={132} bgColor="#f4ecd8" fgColor="#2a2118" level="M" />
            </div>
            <p className="text-center font-serif text-xs text-muted-foreground">
              Send USDC on Arc to this address from any wallet or the Arc testnet faucet.
            </p>
            <div className="flex w-full items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-sm bg-secondary px-3 py-2 font-mono text-xs text-ink">
                {address}
              </code>
              <button
                onClick={copy}
                className="shrink-0 rounded-sm border border-border px-3 py-2 font-mono text-xs text-ink transition-colors hover:bg-secondary"
              >
                {copied ? "✓" : "copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Move to spendable */}
        <div className="mt-3 rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="label-mono">2 · move to spendable</div>
            <span className="font-mono text-xs text-muted-foreground">
              in wallet: ${Number(loose).toFixed(4)}
            </span>
          </div>
          <p className="mt-2 font-serif text-sm text-muted-foreground">
            Deposits loose wallet USDC into Circle Gateway so you can spend it on reads
            and withdraw it.
          </p>
          <button
            onClick={move}
            disabled={busy || !hasLoose}
            className="mt-3 w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Moving…" : hasLoose ? `Move $${Number(loose).toFixed(4)} to spendable` : "Nothing to move yet"}
          </button>
          {tx && (
            <a
              href={explorerTx(tx)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-center font-mono text-xs text-primary hover:underline"
            >
              view deposit on arcscan ↗
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
