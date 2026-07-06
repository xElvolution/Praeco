/**
 * StudioChat - the co-writer sidebar, docked on the right of the Studio. Two
 * faces: Chat (a streaming conversation that can drop text into the article)
 * and Tools (one-click draft/polish/titles/teaser/price). Collapses to a tab.
 * Mirrors the writing-desk layout of a modern editor; themed for Praeco.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9l-4.4 3.2 1.6 5.8L12 14.9 7.3 18l1.6-5.8L4.5 9l5.6-1.4z" />
    </svg>
  );
}

type Msg = { role: "user" | "assistant"; content: string };

export type ToolMode = "draft" | "improve" | "title" | "preview" | "price";

export function StudioChat({
  title,
  body,
  selection,
  pro,
  aiLeft,
  aiLimit,
  onInsert,
  onTool,
  toolBusy,
  onExhausted,
  onSpend,
}: {
  title: string;
  body: string;
  selection: string;
  pro: boolean;
  aiLeft: number;
  aiLimit: number;
  onInsert: (text: string) => void;
  onTool: (mode: ToolMode) => void;
  toolBusy: string | null;
  onExhausted: () => void;
  onSpend: (remaining: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"chat" | "tools">("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const exhausted = aiLeft <= 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    if (exhausted) {
      toast.error(pro ? "No assists left today." : "Out of free assists. Go Pro for more.");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, selection: selection || undefined, title, body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (err.error === "LIMIT_REACHED") {
          onExhausted();
          toast.error(err.message || "You've used today's assists.");
        } else {
          toast.error(err.error || "The co-writer stumbled.");
        }
        setMessages((m) => m.slice(0, -1));
        return;
      }
      // One assist was spent server-side; reflect it locally.
      onSpend(Math.max(0, aiLeft - 1));
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      toast.error((e as Error).message?.slice(0, 120) ?? "chat failed");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  // Collapsed → floating open button.
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open the co-writer"
        className="fixed right-4 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 lg:flex"
      >
        <Spark />
      </button>
    );
  }

  return (
    <motion.aside
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-4 top-24 bottom-6 z-40 hidden w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:flex"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-primary/[0.08] to-transparent px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <Spark />
          <span className="font-display text-sm font-semibold text-ink">Co-writer</span>
          {pro && <span className="rounded-sm bg-patina/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-patina">Pro</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{aiLeft}/{aiLimit}</span>
          <button onClick={() => setOpen(false)} title="Collapse" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-ink">›</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-border">
        {(["chat", "tools"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative h-10 flex-1 text-sm font-medium capitalize transition-colors ${tab === t ? "text-ink" : "text-muted-foreground hover:text-ink"}`}
          >
            {t}
            {tab === t && <motion.div layoutId="studio-chat-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <>
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Spark />
                </div>
                <p className="font-display text-base font-semibold text-ink">Ask the co-writer</p>
                <p className="mt-1.5 font-serif text-sm leading-relaxed text-muted-foreground">
                  Structure, sharpen, fact-check, or draft. Highlight text in the editor to send it as context.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <Bubble
                  key={i}
                  role={m.role}
                  content={m.content}
                  streaming={streaming && i === messages.length - 1 && m.role === "assistant"}
                  onInsert={m.role === "assistant" && m.content ? () => { onInsert(m.content); toast.success("Added to your draft."); } : undefined}
                />
              ))
            )}
          </div>

          {selection && (
            <div className="mx-4 mb-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
              <p className="label-mono mb-0.5 text-primary">attached selection</p>
              <p className="line-clamp-2 font-serif text-xs text-muted-foreground">
                {selection.length > 180 ? selection.slice(0, 180) + "…" : selection}
              </p>
            </div>
          )}

          <div className="flex shrink-0 items-end gap-2 border-t border-border p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={exhausted ? "Out of assists today…" : "Ask anything about your draft…"}
              disabled={streaming || exhausted}
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 font-serif text-sm leading-relaxed text-ink outline-none focus:border-primary disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming || exhausted}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              title="Send"
            >
              ↑
            </button>
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="font-serif text-sm text-muted-foreground">One-click co-writing. Each costs an assist.</p>
          <div className="mt-4 space-y-2">
            <ToolRow label="Generate from title" hint="A full draft from your title" busy={toolBusy === "draft"} disabled={!title.trim() || exhausted} onClick={() => onTool("draft")} primary />
            <ToolRow label="Polish" hint="Tighten and fix the whole piece" busy={toolBusy === "improve"} disabled={!body.trim() || exhausted} onClick={() => onTool("improve")} />
            <ToolRow label="Suggest titles" hint="Five evocative options" busy={toolBusy === "title"} disabled={!body.trim() || exhausted} onClick={() => onTool("title")} />
            <ToolRow label="Write the teaser" hint="The line readers see before paying" busy={toolBusy === "preview"} disabled={!body.trim() || exhausted} onClick={() => onTool("preview")} />
            <ToolRow label="Suggest a price" hint="Per-read price with a rationale" busy={toolBusy === "price"} disabled={!body.trim() || exhausted} onClick={() => onTool("price")} />
          </div>
          {exhausted && !pro && (
            <Link href="/pro" className="mt-5 block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Out of free assists - Go Pro →
            </Link>
          )}
        </div>
      )}
    </motion.aside>
  );
}

function ToolRow({ label, hint, busy, disabled, onClick, primary }: { label: string; hint: string; busy: boolean; disabled: boolean; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={`flex w-full items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-left transition-colors disabled:opacity-40 ${
        primary ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : "border-border bg-background/60 hover:bg-secondary"
      }`}
    >
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${primary ? "text-primary" : "text-ink"}`}>{label}</span>
        <span className="label-mono normal-case tracking-normal">{hint}</span>
      </span>
      <span className={`shrink-0 ${primary ? "text-primary" : "text-muted-foreground"}`}>{busy ? "…" : <Spark />}</span>
    </button>
  );
}

function Bubble({ role, content, streaming, onInsert }: { role: "user" | "assistant"; content: string; streaming: boolean; onInsert?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={`flex flex-col ${role === "user" ? "items-end" : "items-start"}`}>
      <div className={`max-w-[90%] whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background/60 font-serif text-ink"}`}>
        {content}
        {streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary align-middle" />}
      </div>
      {role === "assistant" && content && !streaming && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <button
            onClick={() => { navigator.clipboard?.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            className="label-mono rounded-md px-2 py-1 transition-colors hover:bg-secondary hover:text-ink"
          >
            {copied ? "copied" : "copy"}
          </button>
          {onInsert && (
            <button onClick={onInsert} className="label-mono rounded-md px-2 py-1 text-primary transition-colors hover:bg-primary/10">
              add to draft
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
