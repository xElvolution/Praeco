/**
 * LaurelsChest - a citizen's earned honors: rank laurels (wreath art) and duty
 * seals (from Arena quests). Earned ones shine; locked ones are dimmed with a
 * hint of how to earn them. Server-rendered; data comes from real state.
 * SPDX-License-Identifier: Apache-2.0
 */
import Image from "next/image";
import Link from "next/link";
import type { Badge } from "@/lib/badges";

export function LaurelsChest({ badges, self }: { badges: Badge[]; self: boolean }) {
  const earned = badges.filter((b) => b.earned);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <IconTrophy />
          <h2 className="font-display text-lg font-semibold text-ink">Laurels</h2>
        </div>
        <span className="label-mono">{earned.length} / {badges.length} earned</span>
      </header>

      {earned.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-serif text-muted-foreground">
            No laurels yet.{" "}
            {self ? (
              <Link href="/arena" className="text-primary hover:underline">Take up a duty in the Arena →</Link>
            ) : (
              "Ranks and duties earn them."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.key}
              title={`${b.name} - ${b.detail}${b.earned ? "" : " (locked)"}`}
              className={`flex flex-col items-center gap-2 bg-card px-3 py-4 text-center ${b.earned ? "" : "opacity-40"}`}
            >
              {b.kind === "rank" && b.image ? (
                <Image src={b.image} alt="" width={44} height={44} className={`h-10 w-10 object-contain ${b.earned ? "" : "grayscale"}`} />
              ) : (
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${b.earned ? "bg-primary/12 text-primary ring-1 ring-primary/25" : "bg-secondary text-muted-foreground"}`}>
                  <IconSeal />
                </span>
              )}
              <span className="font-mono text-[10px] uppercase leading-tight tracking-wider text-ink">{b.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IconTrophy() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden>
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
      <path d="M17 5h2.5a1.5 1.5 0 0 1 0 5H16M7 5H4.5a1.5 1.5 0 0 0 0 5H8" />
      <path d="M12 13v4M9 21h6M10 17h4" />
    </svg>
  );
}

function IconSeal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="10" r="6" />
      <path d="M9 15l-1 6 4-2 4 2-1-6" />
      <path d="M12 7v3l2 1" />
    </svg>
  );
}
