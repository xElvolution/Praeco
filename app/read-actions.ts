/**
 * Reader actions: unlock an article and tip a creator, paid from the signed-in
 * citizen's wallet. Requires citizenship (returns NOT_CITIZEN otherwise).
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { currentCitizen } from "@/lib/auth";
import { payAsReader } from "@/lib/treasury";
import {
  getArticleById,
  recordRead,
  bumpArticleStats,
  bumpRenown,
} from "@/lib/data";
import { isTipAmount } from "@/lib/tips";
import { getBaseUrl } from "@/lib/base-url";

/** Payment errors can be long SDK dumps - keep what fits in a toast. */
function briefError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.slice(0, 160);
}

export type UnlockResult =
  | { ok: true; title: string; body: string; transaction: string; amount: string }
  | { ok: false; error: string };

export async function unlockArticle(articleId: string): Promise<UnlockResult> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };

  const article = await getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };

  try {
    const baseUrl = await getBaseUrl();
    const paid = await payAsReader<{ body: string; title: string }>(
      cit.privKey,
      `${baseUrl}/api/read/${articleId}`,
      { method: "GET" },
    );

    await recordRead({
      articleId: article.id,
      creatorId: article.creator_id,
      readerId: cit.user.id,
      readerHandle: cit.user.username,
      readerWallet: cit.user.wallet,
      creatorHandle: article.creator_handle!,
      articleTitle: article.title,
      amountUsdc: article.price_usdc,
      gatewayTx: paid.transaction || null,
      isAgent: false,
    });
    await bumpArticleStats(article.id, article.price_usdc, article.creator_id);
    await bumpRenown(cit.user.id, 1); // a reader earns renown for paying

    return {
      ok: true,
      title: paid.data.title ?? article.title,
      body: paid.data.body,
      transaction: paid.transaction,
      amount: paid.formattedAmount,
    };
  } catch (error) {
    return { ok: false, error: briefError(error) };
  }
}

export type TipResult =
  | { ok: true; transaction: string }
  | { ok: false; error: string };

export async function tipArticle(articleId: string, amount: string): Promise<TipResult> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  if (!isTipAmount(amount)) return { ok: false, error: "Invalid tip amount." };

  const article = await getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };

  try {
    const baseUrl = await getBaseUrl();
    const paid = await payAsReader<{ ok: boolean }>(
      cit.privKey,
      `${baseUrl}/api/tip/${articleId}?amount=${encodeURIComponent(amount)}`,
      { method: "GET" },
    );
    await recordRead({
      articleId: article.id,
      creatorId: article.creator_id,
      readerId: cit.user.id,
      readerHandle: cit.user.username,
      readerWallet: cit.user.wallet,
      creatorHandle: article.creator_handle!,
      articleTitle: `tip · ${article.title}`,
      amountUsdc: amount,
      gatewayTx: paid.transaction || null,
      isAgent: false,
      isTip: true,
    });
    await bumpRenown(cit.user.id, 1);
    return { ok: true, transaction: paid.transaction };
  } catch (error) {
    return { ok: false, error: briefError(error) };
  }
}
