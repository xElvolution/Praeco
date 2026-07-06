/**
 * Subscribe to Pro - pays the fee from the citizen's wallet on Arc.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { subscribePro } from "@/app/pro-actions";

export function SubscribeButton({ price }: { price: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const res = await subscribePro();
    setBusy(false);
    if (res.ok) {
      toast.success("Welcome to Pro. Studio tools unlocked.");
      router.refresh();
    } else if (res.error === "NOT_CITIZEN") {
      router.push("/citizen");
    } else {
      toast.error(res.error.slice(0, 140));
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="rounded-sm bg-primary px-7 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {busy ? (
        <span className="flex items-center gap-2">
          <motion.span animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="inline-block">⊙</motion.span>
          paying ${price}…
        </span>
      ) : (
        <>Subscribe · ${price} USDC / month ⊙</>
      )}
    </button>
  );
}
