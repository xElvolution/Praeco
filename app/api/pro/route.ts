/**
 * Pro paywall endpoint - an x402-gated resource priced at the Pro fee, paid to
 * the platform. The subscribe action pays this from the citizen's wallet.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from "next/server";
import { gatePayment, withPaymentResponseHeader, sellerAddress } from "@/lib/x402";
import { PRO_PRICE_USDC } from "@/lib/pro";

export async function GET(req: NextRequest) {
  try {
    const gate = await gatePayment(req, {
      price: `$${PRO_PRICE_USDC}`,
      payTo: sellerAddress,
      endpoint: "/api/pro",
    });
    if (!gate.ok) return gate.response;
    const response = NextResponse.json({ ok: true, transaction: gate.transaction });
    return withPaymentResponseHeader(response, gate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
