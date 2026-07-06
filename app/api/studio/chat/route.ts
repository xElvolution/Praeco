/**
 * The Studio's conversational co-writer. Streams a reply from OpenAI, with the
 * writer's draft (and any highlighted selection) as context. Each message costs
 * one daily assist - free citizens get a handful, Pro many more.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/settings";
import { currentUser } from "@/lib/auth";
import { aiRemaining, consumeAiCredit } from "@/lib/data";
import { isPro, aiLimitFor } from "@/lib/pro";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.PRAECO_LLM_MODEL ?? "gpt-4o";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Become a citizen to use the studio." }, { status: 401 });
  }

  const limit = aiLimitFor(user);
  const pro = isPro(user);
  if (aiRemaining(user, limit) <= 0) {
    return NextResponse.json(
      { error: "LIMIT_REACHED", upsell: !pro, message: `You've used all ${limit} assists for today.` },
      { status: 429 },
    );
  }

  const key = await getOpenAIKey();
  if (!key) {
    return NextResponse.json({ error: "The co-writer is temporarily unavailable." }, { status: 503 });
  }

  const { messages, selection, title, body } = (await req.json()) as {
    messages: Msg[];
    selection?: string;
    title?: string;
    body?: string;
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Say something first." }, { status: 400 });
  }

  // Strip inline base64 images from the draft context - never ship them to the model.
  const draft = (body ?? "").replace(/!\[([^\]]*)\]\(data:[^)]*\)/g, "![$1](image)").slice(0, 6000);

  const system =
    "You are the co-writer inside Praeco, a per-read publishing platform with a classical, editorial voice. " +
    "Help the writer think, structure, sharpen, and draft. Be concise and concrete; when asked to write, return clean Markdown the writer can drop straight in (no meta-commentary). " +
    (title ? `\n\nWorking title: ${title}` : "") +
    (draft.trim() ? `\n\nCurrent draft (Markdown):\n${draft}` : "\n\nThe draft is empty so far.") +
    (selection?.trim() ? `\n\nThe writer has highlighted this passage - focus on it:\n"""${selection.slice(0, 1500)}"""` : "");

  const client = new OpenAI({ apiKey: key });

  let stream: Awaited<ReturnType<typeof client.chat.completions.create>> & AsyncIterable<{
    choices?: { delta?: { content?: string } }[];
  }>;
  try {
    stream = (await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.8,
      max_tokens: 1200,
      messages: [{ role: "system", content: system }, ...messages],
    })) as typeof stream;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Charge one assist now that the model connection is established.
  await consumeAiCredit(user.id, limit);

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of stream) {
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch {
        /* client disconnected or upstream hiccup - end the stream */
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
