/**
 * The Ledger - public proof of value moving to writers. One toggle switches
 * between The Census (top citizens) and The Ledger (the live carving).
 * SPDX-License-Identifier: Apache-2.0
 */
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { LedgerView } from "@/components/ledger/ledger-view";
import { listReads, ledgerTotals, leaderboard } from "@/lib/data";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [reads, totals, viewer, census] = await Promise.all([
    listReads(60),
    ledgerTotals(),
    currentUser(),
    leaderboard("creators", null, 10),
  ]);
  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <p className="label-mono">The Ledger · ΛΕΠΤΟΝ</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          Every lepton, on the record
        </h1>
        <p className="mt-3 max-w-xl font-serif text-muted-foreground">
          Value settled in USDC on Arc, humans and agents alike. See who leads, or
          watch each payment land.{" "}
          <Link href="/splits" className="text-primary underline">
            How collaborator splits flow →
          </Link>
        </p>

        <div className="mt-10">
          <LedgerView census={census} reads={reads} totals={totals} viewer={viewer?.username ?? null} />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
