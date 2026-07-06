/**
 * Creator actions: publish a piece as the signed-in citizen. Optional revenue
 * splits across collaborators (the author keeps the remainder).
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { isAddress } from "viem";
import { currentCitizen } from "@/lib/auth";
import { createArticle, createArticleSplits } from "@/lib/data";
import { cleanTopics } from "@/lib/topics";
import { sql } from "@/lib/db";

export type Collaborator = { handle: string; wallet: string; share: string };

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export type PublishResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function publishArticle(form: {
  title: string;
  preview: string;
  body: string;
  price: string;
  topics?: string[];
  collaborators?: Collaborator[];
}): Promise<PublishResult> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };

  if (!form.title.trim() || !form.body.trim()) {
    return { ok: false, error: "Title and body are required." };
  }
  const price = parseFloat(form.price);
  if (isNaN(price) || price <= 0) return { ok: false, error: "Enter a price greater than 0." };

  // Unique slug.
  const base = slugify(form.title) || "piece";
  let slug = base;
  for (let i = 0; ; i++) {
    const exists = (await sql`select 1 from articles where slug = ${slug} limit 1`) as unknown[];
    if (exists.length === 0) break;
    slug = `${base}-${(i + 2).toString(36)}`;
  }

  const preview =
    form.preview.trim() || form.body.trim().slice(0, 180).replace(/\s+\S*$/, "") + "…";

  // Validate splits BEFORE inserting the article - otherwise a >100% share
  // leaves an orphaned article with no split rules.
  const collabs = (form.collaborators ?? []).filter(
    (c) => c.handle.trim() && isAddress(c.wallet) && Number(c.share) > 0,
  );
  let splits: { handle: string; wallet: string; shareBps: number }[] | null = null;
  if (collabs.length > 0) {
    let collabBps = 0;
    const drafted = collabs.map((c) => {
      const bps = Math.round(Number(c.share) * 100);
      collabBps += bps;
      return { handle: c.handle.trim(), wallet: c.wallet, shareBps: bps };
    });
    const authorBps = 10000 - collabBps;
    if (authorBps < 0) return { ok: false, error: "Collaborator shares exceed 100%." };
    if (authorBps > 0) {
      drafted.unshift({ handle: cit.user.username, wallet: cit.user.wallet, shareBps: authorBps });
    }
    splits = drafted;
  }

  const article = await createArticle({
    creatorId: cit.user.id,
    slug,
    title: form.title.trim(),
    preview,
    body: form.body.trim(),
    priceUsdc: price.toFixed(price < 0.01 ? 6 : 2),
    topics: cleanTopics(form.topics),
  });

  if (splits) await createArticleSplits(article.id, splits);

  return { ok: true, slug };
}
