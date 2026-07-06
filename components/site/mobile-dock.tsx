/**
 * Mobile dock - the fixed bottom nav on phones. Five thumb-reachable
 * destinations, mirroring the top nav's routes. Hidden ≥md so the desktop
 * nav is the only chrome. The layout adds bottom padding so nothing hides
 * behind it.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode; matches: (p: string) => boolean };

const ITEMS: Item[] = [
  {
    href: "/read",
    label: "Forum",
    matches: (p) => p === "/read" || p.startsWith("/read/") || p.startsWith("/a/") || p.startsWith("/u/"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5a1 1 0 0 1 1-1h4a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4Z" />
        <path d="M20 5a1 1 0 0 0-1-1h-4a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6Z" />
      </svg>
    ),
  },
  {
    href: "/studio",
    label: "Studio",
    matches: (p) => p.startsWith("/studio"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 5 4 4" />
        <path d="M3 21v-4l12-12 4 4L7 21H3Z" />
      </svg>
    ),
  },
  {
    href: "/arena",
    label: "Arena",
    matches: (p) => p.startsWith("/arena"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h10l-.6 4.5A5 5 0 0 1 12 12a5 5 0 0 1-4.4-3.5Z" />
        <path d="M12 12v4" />
        <path d="M8 20h8" />
        <path d="M9.5 16h5" />
      </svg>
    ),
  },
  {
    href: "/agent",
    label: "Agent",
    matches: (p) => p.startsWith("/agent"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="7" width="14" height="12" rx="2" />
        <path d="M9 12h.01M15 12h.01" />
        <path d="M9 16h6" />
        <path d="M12 3v4" />
      </svg>
    ),
  },
  {
    href: "/me",
    label: "Me",
    matches: (p) => p === "/me" || p.startsWith("/me/") || p === "/settings" || p.startsWith("/citizen"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export function MobileDock() {
  const pathname = usePathname() || "/";

  // Don't render on the marketing landing - it has its own hero-driven CTA
  // and the dock would clash with the scroll narrative.
  if (pathname === "/") return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-parchment/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.matches(pathname);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-ink"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center ${active ? "" : "opacity-90"}`}>
                  {it.icon}
                </span>
                <span className={`font-mono text-[10px] uppercase tracking-wider ${active ? "text-primary" : ""}`}>
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
