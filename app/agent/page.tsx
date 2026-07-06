/**
 * The Reader-Agent - dispatch an autonomous paying agent + browse past runs.
 * SPDX-License-Identifier: Apache-2.0
 */
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { RunForm } from "@/components/agent/run-form";
import { listAgentRuns } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const runs = await listAgentRuns(20);
  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-2xl px-6 pb-24 pt-14">
        <p className="label-mono">Reader-Agent · a paying patron</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          An agent that pays its own way
        </h1>
        <p className="mt-3 font-serif text-muted-foreground">
          Give it a topic and a budget. It reads the catalog, decides what is
          worth the toll, pays the writers in USDC on its own, and briefs you on
          what it learned. Every decision is on the record.
        </p>

        <div className="mt-10">
          <RunForm />
        </div>

        {runs.length > 0 && (
          <div className="mt-12">
            <h2 className="label-mono mb-4">past runs</h2>
            <ul className="overflow-hidden rounded-md border border-border bg-card">
              {runs.map((r) => (
                <li key={String(r.id)} className="border-b border-border last:border-0">
                  <Link
                    href={`/agent/${r.id}`}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-secondary/50"
                  >
                    <span className="truncate font-serif text-ink">{String(r.topic)}</span>
                    <span className="label-mono shrink-0 pl-4">
                      ${Number(r.spent_usdc).toFixed(3)} / ${Number(r.budget_usdc).toFixed(2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
