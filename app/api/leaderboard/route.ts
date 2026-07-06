/**
 * Hall of Laurels - leaderboard of top creators and patrons over a time window.
 * Public: returns only public profile fields plus paid-activity aggregates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { leaderboard } from "@/lib/data";

export const dynamic = "force-dynamic";

const WINDOW_DAYS: Record<string, number | null> = {
  week: 7,
  month: 30,
  all: null,
};

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") === "patrons" ? "patrons" : "creators";
  const win = req.nextUrl.searchParams.get("window") ?? "all";
  const days = WINDOW_DAYS[win] ?? null;
  const sinceIso = days === null ? null : new Date(Date.now() - days * 86400_000).toISOString();
  const rows = await leaderboard(kind, sinceIso, 10);
  return NextResponse.json({ rows });
}
