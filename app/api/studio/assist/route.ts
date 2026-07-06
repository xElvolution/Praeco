/**
 * The Studio's AI writing assistant (OpenAI). Modes:
 *  improve · draft · title · preview · price
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/settings";
import { currentUser } from "@/lib/auth";
import { aiRemaining, consumeAiCredit } from "@/lib/data";
import { isPro, aiLimitFor, FREE_DAILY_AI, PRO_DAILY_AI } from "@/lib/pro";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.PRAECO_LLM_MODEL ?? "gpt-4o";
type Mode = "improve" | "draft" | "title" | "preview" | "price";

const PROMPTS: Record<Mode, (text: string, title: string) => { system: string; user: string }> = {
  improve: (text) => ({
    system:
      "You are a sharp literary editor. Polish the writer's piece: tighten flow, fix grammar and clumsy phrasing, strengthen verbs - but PRESERVE their voice, length, and meaning. Do not add new claims. Return ONLY the improved piece, no commentary.",
    user: text,
  }),
  draft: (text, title) => ({
    system:
      "You are a gifted essayist writing for Praeco, a per-read publishing platform with a classical, editorial sensibility. Given a title or a rough idea, write a COMPLETE, publishable article - not an outline, not a summary, not a single paragraph. " +
      "Requirements: 500-900 words; a strong, specific opening line (no throat-clearing like 'In today's world'); 4-7 well-developed paragraphs; use Markdown - include at least two '## ' section headings, and use **bold** or *italics* sparingly for emphasis; a memorable closing thought. Write in an intelligent, human, literary voice. Do NOT restate the title as a heading at the top. Return ONLY the article body in Markdown - no title line, no commentary, no meta-text.",
    user: `Write the full article for this title/idea:\n\n${title || text}\n\n${title && text && text !== title ? `Extra direction from the writer:\n${text}` : ""}`.trim(),
  }),
  title: (text, title) => ({
    system:
      'You are a headline editor. Propose 5 evocative, specific titles. Return JSON {"titles": ["...", ...]} only.',
    user: `Current title: ${title || "(none)"}\nPiece:\n${text.slice(0, 2000)}`,
  }),
  preview: (text, title) => ({
    system:
      "You write the public teaser above a paywall - one vivid sentence or two (≤ 40 words) that makes a reader want to pay. End mid-thought with an ellipsis. Return ONLY the teaser.",
    user: `Title: ${title}\nPiece:\n${text.slice(0, 2000)}`,
  }),
  price: (text, title) => ({
    system:
      'You advise on per-read pricing for nanopayments ($0.001-$1.00). Suggest one price and a one-line rationale. Return JSON {"price":"0.02","why":"..."} only.',
    user: `Title: ${title}\nPiece:\n${text.slice(0, 1500)}`,
  }),
};

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Become a citizen to use the studio." }, { status: 401 });
  }
  // The AI co-writer is free up to a small daily cap; Pro raises it. Cheap peek
  // at the cap before doing anything expensive - the atomic consume happens ONLY
  // after OpenAI returns, so failed requests don't burn a credit.
  const limit = aiLimitFor(user);
  const pro = isPro(user);
  if (aiRemaining(user, limit) <= 0) {
    return NextResponse.json(
      {
        error: "LIMIT_REACHED",
        upsell: !pro,
        message: pro
          ? `You've used all ${limit} assists for today.`
          : `You've used your ${FREE_DAILY_AI} free assists today. Go Pro for ${PRO_DAILY_AI} a day.`,
      },
      { status: 429 },
    );
  }
  const key = await getOpenAIKey();
  if (!key) {
    return NextResponse.json({ error: "The writing assistant is temporarily unavailable." }, { status: 503 });
  }
  const { mode, text, title } = (await req.json()) as { mode: Mode; text: string; title?: string };
  if (!PROMPTS[mode]) return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  if (!text || text.trim().length < 3) return NextResponse.json({ error: "Write a little first." }, { status: 400 });

  const client = new OpenAI({ apiKey: key });
  const { system, user: userPrompt } = PROMPTS[mode](text, title ?? "");
  const json = mode === "title" || mode === "price";
  // Long-form modes need room and a little more warmth; short structured modes stay tight.
  const longForm = mode === "draft" || mode === "improve";
  let out: string;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      ...(json ? { response_format: { type: "json_object" as const } } : {}),
      ...(longForm ? { max_tokens: 1800, temperature: 0.8 } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });
    out = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Consume the daily credit only after the model actually delivered.
  const credit = await consumeAiCredit(user.id, limit);
  if (!credit.allowed) {
    return NextResponse.json(
      { error: "LIMIT_REACHED", upsell: !pro, message: `You've used all ${limit} assists for today.` },
      { status: 429 },
    );
  }

  if (json) return NextResponse.json({ ...JSON.parse(out), remaining: credit.remaining });
  return NextResponse.json({ result: out, remaining: credit.remaining });
}
