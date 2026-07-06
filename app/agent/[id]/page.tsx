/**
 * A single Reader-Agent run - its decisions (pay/skip + reasons) and briefing.
 * Public + shareable: the transparent record of an agent spending real money.
 * SPDX-License-Identifier: Apache-2.0
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { getAgentRun } from "@/lib/data";
import { explorerTx } from "@/lib/arc";

export const dynamic = "force-dynamic";

export default async function AgentRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAgentRun(id);
  if (!data) notFound();
  const run = data.run as Record<string, unknown>;
  const decisions = data.decisions as Record<string, unknown>[];
  const paid = decisions.filter((d) => d.decision === "pay");

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-2xl px-6 pb-24 pt-14">
        <Link href="/agent" className="label-mono hover:text-ink">
          ← the reader-agent
        </Link>

        <p className="mt-6 label-mono">agent run</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-balance text-ink">
          {String(run.topic)}
        </h1>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <span className="label-mono">budget ${Number(run.budget_usdc).toFixed(2)}</span>
          <span className="label-mono">spent ${Number(run.spent_usdc).toFixed(4)}</span>
          <span className="label-mono">{paid.length} of {decisions.length} paid</span>
        </div>

        {/* Decision log */}
        <h2 className="rule mt-10 pt-6 font-display text-xl font-semibold text-ink">
          The agent&apos;s decisions
        </h2>
        <ul className="mt-4 space-y-px overflow-hidden rounded-md border border-border bg-border">
          {decisions.map((d) => {
            const isPay = d.decision === "pay";
            return (
              <li key={String(d.id)} className="bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={`mr-2 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        isPay
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPay ? "paid" : "skipped"}
                    </span>
                    <span className="font-serif font-medium text-ink">{String(d.article_title)}</span>
                    <span className="label-mono"> · {String(d.creator_handle)}</span>
                    <p className="mt-1 font-serif text-sm text-muted-foreground">{String(d.reason)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs text-ink">rel {String(d.relevance)}</div>
                    {isPay && d.amount_usdc != null && (
                      <div className="label-mono">⊙ ${Number(d.amount_usdc).toFixed(3)}</div>
                    )}
                    {isPay && d.gateway_tx != null && (
                      <a
                        href={explorerTx(String(d.gateway_tx))}
                        target="_blank"
                        rel="noreferrer"
                        className="label-mono underline hover:text-ink"
                      >
                        {String(d.gateway_tx).slice(0, 8)}…
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Briefing */}
        <h2 className="rule mt-10 pt-6 font-display text-xl font-semibold text-ink">
          The agent&apos;s briefing
        </h2>
        <article className="mt-4 whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink">
          {String(run.synthesis ?? "")}
        </article>
      </section>
    </div>
  );
}
