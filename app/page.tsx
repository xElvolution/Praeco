/**
 * Praeco home - the editorial scroll-narrative showpiece.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Landing } from "@/components/landing/landing";
import { listArticles, ledgerTotals, listReads } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articles, totals, reads] = await Promise.all([
    listArticles(),
    ledgerTotals(),
    listReads(20),
  ]);
  return <Landing articles={articles} totals={totals} reads={reads} />;
}
