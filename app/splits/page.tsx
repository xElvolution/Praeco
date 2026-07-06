/**
 * Splits - royalties that follow a work. Shows which pieces split their toll
 * and how much each collaborator has accrued across all reads.
 * SPDX-License-Identifier: Apache-2.0
 */
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { listSplitArticles, splitEarningsSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SplitsPage() {
  const [articles, earnings] = await Promise.all([
    listSplitArticles(),
    splitEarningsSummary(),
  ]);

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <p className="label-mono">Splits · royalties that follow a work</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          One read, paid to everyone who made it
        </h1>
        <p className="mt-3 max-w-xl font-serif text-muted-foreground">
          When a piece has collaborators, every read fans its toll out by share:
          author, editor, co-writer. All automatic, settled on Arc. Here is what
          each has earned.
        </p>

        {/* Accrued earnings */}
        <h2 className="rule mt-10 pt-6 font-display text-xl font-semibold text-ink">Accrued earnings</h2>
        {earnings.length === 0 ? (
          <p className="mt-4 font-serif text-muted-foreground">
            No split earnings yet. Publish a piece with a collaborator in{" "}
            <Link href="/studio" className="text-primary underline">the Studio</Link>.
          </p>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-md border border-border bg-card">
            {earnings.map((e) => (
              <li key={e.payee_wallet} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
                <div className="min-w-0">
                  <span className="font-serif font-medium text-ink">{e.payee_handle}</span>
                  <span className="label-mono"> · {e.payee_wallet.slice(0, 10)}…</span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm text-ink">⊙ ${Number(e.total).toFixed(4)}</div>
                  <div className="label-mono">{e.payments} payments</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Split rules */}
        <h2 className="rule mt-10 pt-6 font-display text-xl font-semibold text-ink">Pieces with splits</h2>
        {articles.length === 0 ? (
          <p className="mt-4 font-serif text-muted-foreground">No split pieces yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {articles.map((a) => (
              <li key={a.id} className="rounded-md border border-border bg-card p-5">
                <Link href={`/a/${a.slug}`} className="font-display text-lg font-semibold text-ink hover:text-primary">
                  {a.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.splits.map((s) => (
                    <span key={s.id} className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-xs text-ink">
                      {s.payee_handle} {(s.share_bps / 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
