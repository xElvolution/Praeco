/**
 * ReadGate - pay-to-read. Reading is paid from the signed-in citizen's wallet;
 * a non-citizen is sent to the ritual first. After reading, you can tip.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { unlockArticle, tipArticle } from "@/app/read-actions";
import { explorerTx } from "@/lib/arc";
import { TIP_AMOUNTS } from "@/lib/tips";
import { Markdown } from "@/components/reader/markdown";

function TipRow({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [tipping, setTipping] = useState<string | null>(null);
  const [tipped, setTipped] = useState(false);
  async function tip(amount: string) {
    setTipping(amount);
    const res = await tipArticle(articleId, amount);
    setTipping(null);
    if (res.ok) {
      setTipped(true);
      toast.success(`Tipped $${amount}. Straight to the writer. ⊙`);
    } else if (res.error === "NOT_CITIZEN") {
      router.push("/citizen");
    } else {
      toast.error(res.error.slice(0, 120));
    }
  }
  if (tipped) return <p className="mt-10 label-mono">⊙ thank you. Your tip is on the ledger.</p>;
  return (
    <div className="mt-10 rounded-md border border-border bg-secondary/40 p-5 text-center">
      <p className="label-mono">enjoyed it? tip the writer</p>
      <div className="mt-3 flex justify-center gap-2">
        {TIP_AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => tip(a)}
            disabled={tipping !== null}
            className="rounded-sm border border-primary/40 bg-card px-4 py-2 font-mono text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {tipping === a ? "…" : `⊙ $${a}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReadGate({ articleId, price }: { articleId: string; price: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"locked" | "paying" | "unlocked">("locked");
  const [body, setBody] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);

  async function read() {
    setPhase("paying");
    const res = await unlockArticle(articleId);
    if (res.ok) {
      setBody(res.body);
      setTx(res.transaction);
      setPhase("unlocked");
      toast.success(`Paid ${res.amount} USDC. The writer is paid.`);
    } else if (res.error === "NOT_CITIZEN") {
      toast.message("Become a citizen to read. It takes a moment.");
      router.push("/citizen");
    } else {
      setPhase("locked");
      toast.error(res.error.slice(0, 120));
    }
  }

  if (phase === "unlocked" && body) {
    return (
      <div>
        <div className="mb-8 flex items-center gap-3 rounded-md border border-patina/30 bg-patina/5 px-4 py-3">
          <span className="text-lg">⊙</span>
          <p className="font-mono text-xs text-patina">
            Paid {price} USDC · settled on Arc
            {tx && (
              <>
                {" · "}
                <a className="underline hover:text-ink" href={explorerTx(tx)} target="_blank" rel="noreferrer">
                  {tx.slice(0, 10)}…
                </a>
              </>
            )}
          </p>
        </div>
        <article>
          <Markdown>{body}</Markdown>
        </article>
        <TipRow articleId={articleId} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-card p-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      <div className="flex flex-col items-center gap-3 text-center">
        <button
          onClick={read}
          disabled={phase === "paying"}
          className="group relative rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {phase === "paying" ? (
            <span className="flex items-center gap-2">
              <motion.span animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="inline-block">⊙</motion.span>
              paying the toll…
            </span>
          ) : (
            <>Read for {price} USDC ⊙</>
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          One lepton. Paid straight to the writer, settled in under a second.
        </p>
      </div>
    </div>
  );
}
