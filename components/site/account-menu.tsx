/**
 * Account menu - click the citizen's name to open Profile / Edit / Settings /
 * Sign out. Closes on outside click or escape.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wreath } from "@/components/identity/wreath";

export function AccountMenu({
  username,
  renown,
  tierName,
  pro,
  onLogout,
}: {
  username: string;
  renown: number;
  tierName: string;
  pro?: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const items = [
    { href: "/me", label: "My dashboard", sub: "earnings & wallet" },
    { href: "/arena", label: "Arena", sub: "quests & rank" },
    ...(pro ? [] : [{ href: "/pro", label: "Go Pro", sub: "unlock studio tools" }]),
    { href: "/settings", label: "Settings", sub: "profile · theme · notifications" },
  ];

  return (
    <div ref={ref} className="relative border-l border-border pl-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-sm px-1 py-0.5 transition-opacity hover:opacity-80"
        title={`${tierName} · ${renown} renown`}
      >
        <Wreath renown={renown} size={26} variant="image" />
        <span className="font-mono text-xs text-ink">{username}</span>
        {pro && <span className="rounded-sm bg-primary/15 px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">Pro</span>}
        <span className="text-[10px] text-muted-foreground">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-md border border-border bg-card shadow-lg"
          >
            <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-3">
              <Wreath renown={renown} size={34} variant="image" />
              <div>
                <div className="font-mono text-sm text-ink">{username}</div>
                <div className="label-mono">{tierName} · {renown} renown</div>
              </div>
            </div>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 transition-colors hover:bg-secondary/60"
              >
                <div className="font-serif text-sm text-ink">{it.label}</div>
                <div className="label-mono">{it.sub}</div>
              </Link>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="block w-full border-t border-border px-4 py-2.5 text-left font-serif text-sm text-destructive transition-colors hover:bg-secondary/60"
            >
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
