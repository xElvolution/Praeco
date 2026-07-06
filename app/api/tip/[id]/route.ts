/**
 * Tip endpoint - a variable-amount x402 payment straight to the article's
 * creator (pay-what-you-want, on top of the per-read toll).
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { gatePayment, withPaymentResponseHeader } from "@/lib/x402";
import { getArticleById } from "@/lib/data";
import { isTipAmount } from "@/lib/tips";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const amount = req.nextUrl.searchParams.get("amount") ?? "";
  if (!isTipAmount(amount)) {
    return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 });
  }
  const article = await getArticleById(id);
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  if (!article.creator_wallet) {
    return NextResponse.json({ error: "This piece has no payout wallet." }, { status: 409 });
  }

  try {
    const gate = await gatePayment(req, {
      price: `$${amount}`,
      payTo: article.creator_wallet,
      endpoint: `/api/tip/${id}`,
    });
    if (!gate.ok) return gate.response;
    const response = NextResponse.json({ ok: true, transaction: gate.transaction });
    return withPaymentResponseHeader(response, gate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
