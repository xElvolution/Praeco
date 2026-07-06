/**
 * Per-article paid read endpoint. Gated by x402.
 * - No splits: payTo = the creator's wallet (USDC settles straight to them).
 * - With splits: payTo = the platform splitter wallet, and each collaborator's
 *   share accrues in split_earnings (royalties that follow the work).
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { gatePayment, withPaymentResponseHeader, sellerAddress } from "@/lib/x402";
import { getArticleById, getArticleSplits, recordSplitEarning } from "@/lib/data";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const article = await getArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const splits = await getArticleSplits(id);
  // Split articles settle to the platform splitter; solo articles to the creator.
  const payTo = splits.length > 0 ? sellerAddress : article.creator_wallet;
  if (!payTo) {
    return NextResponse.json({ error: "This piece has no payout wallet." }, { status: 409 });
  }

  try {
    const gate = await gatePayment(req, {
      price: `$${article.price_usdc}`,
      payTo,
      endpoint: `/api/read/${id}`,
    });
    if (!gate.ok) return gate.response;

    // Credit each collaborator their share of the toll.
    if (splits.length > 0) {
      const total = Number(article.price_usdc);
      for (const s of splits) {
        const share = ((total * s.share_bps) / 10000).toFixed(6);
        await recordSplitEarning({
          articleId: article.id,
          payeeHandle: s.payee_handle,
          payeeWallet: s.payee_wallet,
          amountUsdc: share,
        });
      }
    }

    const response = NextResponse.json({
      id: article.id,
      title: article.title,
      body: article.body,
      creator: article.creator_handle,
      transaction: gate.transaction,
    });
    return withPaymentResponseHeader(response, gate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[read] error:", message);
    return NextResponse.json({ error: "Payment processing error", message }, { status: 500 });
  }
}
