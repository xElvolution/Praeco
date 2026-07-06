/**
 * User search - powers the global search overlay. Matches @username or display
 * name, case-insensitive. Public: returns only public profile fields.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 1) return NextResponse.json({ users: [] });
  const users = await searchUsers(q, 8);
  return NextResponse.json({ users });
}
