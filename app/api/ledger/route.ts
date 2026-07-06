/**
 * Ledger feed API - recent reads + running totals, polled by the live feed.
 * `?scope=mine` returns only the signed-in citizen's reads (as reader or creator).
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { listReads, listReadsForUser, ledgerTotals } from "@/lib/data";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");
  if (scope === "mine") {
    const user = await currentUser();
    if (!user) return NextResponse.json({ reads: [], totals: null, scope: "mine" });
    const reads = await listReadsForUser(user.username, 60);
    return NextResponse.json({ reads, totals: null, scope: "mine" });
  }
  const [reads, totals] = await Promise.all([listReads(60), ledgerTotals()]);
  return NextResponse.json({ reads, totals, scope: "all" });
}
