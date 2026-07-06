/**
 * Reader-Agent trigger form. Posts a topic + budget, then routes to the run.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function RunForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [budget, setBudget] = useState("0.05");
  const [running, setRunning] = useState(false);

  async function run() {
    if (!topic.trim()) return;
    setRunning(true);
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "run failed");
      toast.success(`Agent spent ${data.spent} USDC across ${data.paidCount} reads.`);
      router.push(`/agent/${data.runId}`);
    } catch (e) {
      toast.error((e as Error).message.slice(0, 140));
      setRunning(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-6">
      <label className="label-mono mb-1.5 block">research topic</label>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. how the ancients thought about time"
        className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-ink outline-none focus:border-primary"
      />
      <div className="mt-4 flex items-end gap-4">
        <div className="w-40">
          <label className="label-mono mb-1.5 block">budget (USDC)</label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-ink outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={run}
          disabled={running}
          className="rounded-sm bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {running ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotateY: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block"
              >
                ⊙
              </motion.span>
              the agent is reading…
            </span>
          ) : (
            <>Dispatch the agent ⊙</>
          )}
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        The agent gets its own funded wallet, decides which pieces are worth the
        toll, pays the writers itself, and briefs you on what it read.
      </p>
    </div>
  );
}
