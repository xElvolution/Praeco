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
import { explorerTx, ARC_FAUCET } from "@/lib/arc";
import { useRouter } from "next/navigation";

export function DepositDialog({ address, loose }: { address: string; loose: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const hasLoose = Number(loose) > 0;

  function copy() {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    toast.success("Address copied.");
    setTimeout(() => setCopied(false), 1600);
  }

  async function move() {
    setBusy(true);
    const res = await sweepToGateway(amount || undefined);
    setBusy(false);
    if (res.ok) {
      setTx(res.txHash);
      setAmount("");
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

        {/* Claim from the faucet */}
        <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <div className="label-mono">1 · claim free test USDC</div>
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase text-primary">Arc testnet</span>
          </div>
          <p className="mt-2 font-serif text-sm text-muted-foreground">
            Copy your address below, then open Circle&apos;s faucet and paste it to receive
            test USDC on Arc. No cost, no card.
          </p>
          <a
            href={ARC_FAUCET}
            target="_blank"
            rel="noreferrer"
            onClick={copy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Copy address &amp; open faucet ↗
          </a>
        </div>

        {/* Receive */}
        <div className="mt-3 rounded-md border border-border bg-card p-5">
          <div className="label-mono mb-3">2 · your Praeco address</div>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-md bg-[#f4ecd8] p-3 ring-1 ring-border">
              <QRCodeSVG value={address} size={132} bgColor="#f4ecd8" fgColor="#2a2118" level="M" />
            </div>
            <p className="text-center font-serif text-xs text-muted-foreground">
              Paste this into the faucet, or send USDC on Arc from any wallet.
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
            <div className="label-mono">3 · move to spendable</div>
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              in wallet: ${Number(loose).toFixed(4)}
              <button
                onClick={() => {
                  router.refresh();
                  toast.success("Balances refreshed.");
                }}
                title="Refresh balance"
                className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-ink transition-colors hover:bg-secondary"
              >
                ↻
              </button>
            </span>
          </div>
          <p className="mt-2 font-serif text-sm text-muted-foreground">
            Deposits loose wallet USDC into Circle Gateway so you can spend it on reads
            and withdraw it. Leave the amount empty to move everything.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={hasLoose ? `up to ${Number(loose).toFixed(4)}` : "0.00"}
              disabled={busy || !hasLoose}
              className="min-w-0 flex-1 rounded-sm border border-border bg-secondary px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
            />
            <button
              onClick={() => setAmount(loose)}
              disabled={busy || !hasLoose}
              className="shrink-0 rounded-sm border border-border px-3 py-2 font-mono text-xs text-ink transition-colors hover:bg-secondary disabled:opacity-50"
            >
              max
            </button>
          </div>
          <button
            onClick={move}
            disabled={busy || !hasLoose}
            className="mt-3 w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Moving…"
              : !hasLoose
                ? "Nothing to move yet"
                : amount
                  ? `Move $${Number(amount || 0).toFixed(4)} to spendable`
                  : `Move all ($${Number(loose).toFixed(4)}) to spendable`}
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
