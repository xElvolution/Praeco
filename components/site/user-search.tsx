/**
 * UserSearch - a global command-palette overlay for finding citizens. Opens
 * from the nav search button (or ⌘K / Ctrl-K), debounces queries against
 * /api/search, and lists matches with their wreath, rank, and pieces. Selecting
 * a result navigates to their public profile.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wreath } from "@/components/identity/wreath";
import { tierForRenown } from "@/lib/tiers";

type Result = { username: string; display_name: string; renown: number; pieces: number };

export function UserSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setResults([]);
    setActive(0);
  }, []);

  // Open handlers: nav button dispatches "praeco:search"; ⌘K / Ctrl-K also open.
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("praeco:search", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("praeco:search", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { cache: "no-store" });
        const data = await res.json();
        if (mine === seq.current) {
          setResults(data.users ?? []);
          setActive(0);
        }
      } catch {
        if (mine === seq.current) setResults([]);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  function go(username: string) {
    close();
    router.push(`/u/${username}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].username);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[110] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Search citizens"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground" aria-hidden>
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search citizens by name or @handle…"
                className="w-full border-0 bg-transparent font-serif text-lg text-ink outline-none placeholder:text-muted-foreground/50"
              />
              <button onClick={close} className="label-mono shrink-0 rounded-sm border border-border px-1.5 py-0.5 hover:text-ink">esc</button>
            </div>

            {/* Results */}
            <div className="max-h-[52vh] overflow-y-auto">
              {q.trim().length < 1 ? (
                <p className="px-4 py-8 text-center font-serif text-sm text-muted-foreground">
                  Find writers and readers across the forum.
                </p>
              ) : loading && results.length === 0 ? (
                <p className="px-4 py-8 text-center label-mono">searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-8 text-center font-serif text-sm text-muted-foreground">
                  No citizen matches “{q.trim()}”.
                </p>
              ) : (
                <ul className="py-1.5">
                  {results.map((u, i) => {
                    const tier = tierForRenown(u.renown);
                    return (
                      <li key={u.username}>
                        <button
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(u.username)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? "bg-secondary/60" : "hover:bg-secondary/40"}`}
                        >
                          <Wreath renown={u.renown} size={32} variant="image" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display text-base font-semibold text-ink">{u.display_name}</span>
                            <span className="label-mono normal-case tracking-normal">@{u.username} · {tier.name}</span>
                          </span>
                          <span className="label-mono shrink-0">{u.pieces} {u.pieces === 1 ? "piece" : "pieces"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The button that opens the overlay - dispatches the shared open event. */
export function SearchTrigger({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  function open() {
    window.dispatchEvent(new Event("praeco:search"));
  }
  if (compact) {
    return (
      <button onClick={open} aria-label="Search" className={`text-muted-foreground transition-colors hover:text-ink ${className}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    );
  }
  return (
    <button
      onClick={open}
      className={`flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-ink ${className}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
      </svg>
      Search
      <span className="ml-1 hidden rounded-sm border border-border px-1 font-mono text-[10px] sm:inline">⌘K</span>
    </button>
  );
}
