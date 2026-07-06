/**
 * The Reader-Agent - an autonomous paying agent.
 *
 * Given a topic and a USDC budget, it reads the public catalog, DECIDES which
 * paid articles are worth the toll (real LLM reasoning via OpenAI), pays the
 * creators on its own via a custodial Gateway wallet, reads what it bought, and
 * synthesizes a briefing. Every decision is logged for transparency. Falls back
 * to a keyword heuristic if no OpenAI key is configured, so it never crashes.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import OpenAI from "openai";
import type { Hex } from "viem";
import { provisionReaderWallet, payAsReader } from "./treasury";
import { getOpenAIKey } from "./settings";
import {
  listArticles,
  recordRead,
  bumpArticleStats,
  createAgentRun,
  finishAgentRun,
  recordAgentDecision,
} from "./data";

const MODEL = process.env.PRAECO_LLM_MODEL ?? "gpt-4o";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

type Decision = {
  article_id: string;
  decision: "pay" | "skip";
  relevance: number;
  reason: string;
};

type CatalogItem = {
  article_id: string;
  title: string;
  creator?: string;
  price_usdc: string;
  preview: string;
};

const DECISION_JSON_SCHEMA = {
  name: "reader_agent_decisions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      plan: { type: "string", description: "One sentence: how you'll approach this topic." },
      decisions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            article_id: { type: "string" },
            decision: { type: "string", enum: ["pay", "skip"] },
            relevance: { type: "integer", description: "0-100 relevance to the topic" },
            reason: { type: "string", description: "Why pay or skip, one line." },
          },
          required: ["article_id", "decision", "relevance", "reason"],
        },
      },
    },
    required: ["plan", "decisions"],
  },
} as const;

const SYSTEM_DECIDE =
  "You are Praeco's Reader-Agent: an autonomous agent with a fixed USDC budget that pays per-read to access paywalled articles in service of a research topic. You are frugal and decisive - you only spend on pieces that genuinely advance the topic, and you skip the rest. You are charged real USDC for every article you mark 'pay', so choose well and stay within budget.";

const SYSTEM_BRIEF =
  "You are Praeco's Reader-Agent writing a short briefing for the person who set your research topic. Synthesize ONLY from the articles you paid to read. Cite creators by name. Be concise and useful - a few tight paragraphs.";

async function decideWithLLM(
  client: OpenAI | null,
  topic: string,
  budgetUsdc: number,
  catalog: CatalogItem[],
): Promise<{ plan: string; decisions: Decision[] } | null> {
  if (!client) return null;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_schema", json_schema: DECISION_JSON_SCHEMA },
      messages: [
        { role: "system", content: SYSTEM_DECIDE },
        {
          role: "user",
          content: `Topic: "${topic}"\nBudget: ${budgetUsdc} USDC total.\n\nThe paywalled catalog (you only see title + free preview before paying):\n${JSON.stringify(catalog, null, 2)}\n\nDecide which to pay for and which to skip. Rank by relevance. Do not exceed the budget across the articles you mark "pay".`,
        },
      ],
    });
    const text = completion.choices[0]?.message?.content;
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.error("[agent] OpenAI decide failed, using heuristic:", (err as Error).message);
    return null;
  }
}

function decideHeuristic(
  topic: string,
  catalog: CatalogItem[],
): { plan: string; decisions: Decision[] } {
  const stop = new Set(["the", "and", "for", "how", "with", "that", "this", "per", "from", "value"]);
  const topicWords = new Set(
    topic.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !stop.has(w)),
  );
  const decisions = catalog.map((a) => {
    const hay = `${a.title} ${a.preview}`.toLowerCase();
    let overlap = 0;
    topicWords.forEach((w) => {
      if (hay.includes(w)) overlap += 1;
    });
    const relevance = Math.min(100, overlap * 30);
    const pay = relevance >= 30;
    return {
      article_id: a.article_id,
      decision: (pay ? "pay" : "skip") as "pay" | "skip",
      relevance,
      reason: pay
        ? `Matches the topic on ${overlap} key term${overlap === 1 ? "" : "s"}.`
        : "Little overlap with the topic.",
    };
  });
  return { plan: `Heuristic pass over "${topic}".`, decisions };
}

async function briefWithLLM(
  client: OpenAI | null,
  topic: string,
  pieces: { title: string; creator: string; body: string }[],
): Promise<string | null> {
  if (!client) return null;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_BRIEF },
        {
          role: "user",
          content: `Topic: "${topic}"\n\nArticles you paid to read:\n${pieces
            .map((p) => `### ${p.title} - by ${p.creator}\n${p.body}`)
            .join("\n\n")}\n\nWrite the briefing.`,
        },
      ],
    });
    return completion.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function briefTemplate(
  topic: string,
  pieces: { title: string; creator: string; body: string }[],
): string {
  const lines = pieces.map((p) => {
    const para = p.body.split("\n").filter(Boolean).slice(1).join(" ").slice(0, 220);
    return `• ${p.title} - ${p.creator}: ${para}…`;
  });
  return `Briefing on "${topic}" - from ${pieces.length} piece${
    pieces.length === 1 ? "" : "s"
  } the agent paid to read:\n\n${lines.join("\n\n")}`;
}

export type AgentRunResult = {
  runId: string;
  plan: string;
  spent: string;
  paidCount: number;
  synthesis: string;
  usedLLM: boolean;
};

export async function runReaderAgent(
  topic: string,
  budgetUsdc: number,
): Promise<AgentRunResult> {
  const articles = await listArticles();
  if (articles.length === 0) throw new Error("No articles to read yet.");

  const apiKey = await getOpenAIKey();
  const client = apiKey ? new OpenAI({ apiKey }) : null;

  // Provision + fund the agent's own custodial wallet (not a citizen account).
  const wallet = await provisionReaderWallet();
  const run = await createAgentRun({
    topic,
    budget: String(budgetUsdc),
    wallet: wallet.address,
  });

  // 1. DECIDE.
  const catalog: CatalogItem[] = articles.map((a) => ({
    article_id: a.id,
    title: a.title,
    creator: a.creator_name,
    price_usdc: a.price_usdc,
    preview: a.preview,
  }));
  const llmResult = await decideWithLLM(client, topic, budgetUsdc, catalog);
  const usedLLM = llmResult !== null;
  const parsed = llmResult ?? decideHeuristic(topic, catalog);

  const byId = new Map(articles.map((a) => [a.id, a]));
  const ranked = [...parsed.decisions].sort((a, b) => b.relevance - a.relevance);

  // 2. PAY in priority order until the budget runs out.
  let spent = 0;
  let paidCount = 0;
  const readPieces: { title: string; creator: string; body: string }[] = [];

  for (const d of ranked) {
    const article = byId.get(d.article_id);
    if (!article) continue;
    const price = Number(article.price_usdc);

    if (d.decision === "skip" || spent + price > budgetUsdc) {
      await recordAgentDecision({
        runId: run.id,
        articleId: article.id,
        articleTitle: article.title,
        creatorHandle: article.creator_handle ?? "unknown",
        decision: "skip",
        reason:
          d.decision === "skip"
            ? d.reason
            : `Out of budget (${spent.toFixed(3)}/${budgetUsdc}) - ${d.reason}`,
        relevance: d.relevance,
        amountUsdc: null,
        gatewayTx: null,
      });
      continue;
    }

    try {
      const paid = await payAsReader<{ body: string; title: string }>(
        wallet.privateKey as Hex,
        `${BASE_URL}/api/read/${article.id}`,
        { method: "GET" },
      );
      spent += price;
      paidCount += 1;
      readPieces.push({
        title: article.title,
        creator: article.creator_name ?? article.creator_handle ?? "unknown",
        body: paid.data.body,
      });

      await recordRead({
        articleId: article.id,
        creatorId: article.creator_id,
        readerId: null,
        readerHandle: "reader-agent",
        readerWallet: wallet.address,
        creatorHandle: article.creator_handle ?? "unknown",
        articleTitle: article.title,
        amountUsdc: article.price_usdc,
        gatewayTx: paid.transaction || null,
        isAgent: true,
      });
      await bumpArticleStats(article.id, article.price_usdc, article.creator_id);
      await recordAgentDecision({
        runId: run.id,
        articleId: article.id,
        articleTitle: article.title,
        creatorHandle: article.creator_handle ?? "unknown",
        decision: "pay",
        reason: d.reason,
        relevance: d.relevance,
        amountUsdc: article.price_usdc,
        gatewayTx: paid.transaction || null,
      });
    } catch (err) {
      await recordAgentDecision({
        runId: run.id,
        articleId: article.id,
        articleTitle: article.title,
        creatorHandle: article.creator_handle ?? "unknown",
        decision: "skip",
        reason: `Payment failed: ${(err as Error).message.slice(0, 80)}`,
        relevance: d.relevance,
        amountUsdc: null,
        gatewayTx: null,
      });
    }
  }

  // 3. BRIEF.
  let synthesis = "The agent found nothing worth paying for under this budget.";
  if (readPieces.length > 0) {
    synthesis =
      (await briefWithLLM(client, topic, readPieces)) ?? briefTemplate(topic, readPieces);
  }

  await finishAgentRun(run.id, spent.toFixed(6), synthesis);

  return {
    runId: run.id,
    plan: parsed.plan,
    spent: spent.toFixed(4),
    paidCount,
    synthesis,
    usedLLM,
  };
}
