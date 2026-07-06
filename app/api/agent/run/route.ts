/**
 * Trigger a Reader-Agent run. POST { topic, budget } → { runId }.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { runReaderAgent } from "@/lib/reader-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { topic, budget } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    const b = Number(budget);
    if (isNaN(b) || b <= 0) {
      return NextResponse.json({ error: "budget must be > 0" }, { status: 400 });
    }
    const result = await runReaderAgent(topic.slice(0, 200), b);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[agent] run failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
