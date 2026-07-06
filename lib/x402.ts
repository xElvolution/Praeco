/**
 * x402 / Circle Gateway payment gating for Praeco.
 *
 * Derived from Circle's arc-nanopayments reference (Apache-2.0). Adds:
 *  - per-request `payTo` so each article pays its own creator
 *  - a reusable `gatePayment()` core shared by the generic wrapper and the
 *    dynamic per-article read route
 *  - Neon persistence (replacing the reference's Supabase)
 *  - the 30-day authorization window (see praeco-arc-gotchas)
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { NextRequest, NextResponse } from "next/server";
import { recordPaymentEvent } from "./data";

const ARC_TESTNET_NETWORK = "eip155:5042002";
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";
const ARC_TESTNET_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

export const sellerAddress = process.env.SELLER_ADDRESS as `0x${string}`;

const facilitator = new BatchFacilitatorClient();

interface PaymentPayload {
  x402Version: number;
  resource?: { url: string; description: string; mimeType: string };
  accepted?: Record<string, unknown>;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export function buildPaymentRequirements(price: string, payTo: string) {
  const amount = Math.round(parseFloat(price.replace("$", "")) * 1_000_000);
  return {
    scheme: "exact" as const,
    network: ARC_TESTNET_NETWORK,
    asset: ARC_TESTNET_USDC,
    amount: amount.toString(),
    payTo,
    // Circle's testnet facilitator rejects short windows
    // (authorization_validity_too_short). 4 days is no longer enough - use 30.
    maxTimeoutSeconds: 30 * 24 * 60 * 60,
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: ARC_TESTNET_GATEWAY_WALLET,
    },
  };
}

function challenge(endpoint: string, price: string, requirements: object) {
  const paymentRequired = {
    x402Version: 2,
    resource: {
      url: endpoint,
      description: `Paid resource (${price} USDC)`,
      mimeType: "application/json",
    },
    accepts: [requirements],
  };
  return new NextResponse(JSON.stringify({}), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(paymentRequired)).toString(
        "base64",
      ),
    },
  });
}

export type GateResult =
  | { ok: false; response: NextResponse }
  | { ok: true; payer: string; transaction: string; amountUsdc: string; network: string };

/**
 * Core payment gate. Returns either a 402/error response to send back, or a
 * settled result (payer + tx) the caller uses to serve content and record state.
 */
export async function gatePayment(
  req: NextRequest,
  opts: { price: string; payTo: string; endpoint: string },
): Promise<GateResult> {
  const { price, payTo, endpoint } = opts;
  const requirements = buildPaymentRequirements(price, payTo);
  const paymentSignature = req.headers.get("payment-signature");

  if (!paymentSignature) {
    console.log(`[x402] 402 Payment Required: ${endpoint}`);
    return { ok: false, response: challenge(endpoint, price, requirements) };
  }

  const paymentPayload: PaymentPayload = JSON.parse(
    Buffer.from(paymentSignature, "base64").toString("utf-8"),
  );

  const verifyResult = await facilitator.verify(paymentPayload, requirements);
  if (!verifyResult.isValid) {
    console.error(
      `[x402] verify FAILED for ${endpoint}: reason=${verifyResult.invalidReason}`,
    );
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payment verification failed", reason: verifyResult.invalidReason },
        { status: 402 },
      ),
    };
  }

  const settleResult = await facilitator.settle(paymentPayload, requirements);
  if (!settleResult.success) {
    console.error(`[x402] Settlement failed for ${endpoint}: ${settleResult.errorReason}`);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payment settlement failed", reason: settleResult.errorReason },
        { status: 402 },
      ),
    };
  }

  const amountUsdc = (Number(requirements.amount) / 1e6).toString();
  const payer = settleResult.payer ?? verifyResult.payer ?? "unknown";
  const transaction = settleResult.transaction ?? "";

  await recordPaymentEvent({
    endpoint,
    payer,
    amountUsdc,
    network: requirements.network,
    gatewayTx: transaction || null,
    raw: { requirements, settleResult },
  });

  console.log(`[x402] Payment settled: ${endpoint} - ${amountUsdc} USDC from ${payer}`);
  return { ok: true, payer, transaction, amountUsdc, network: requirements.network };
}

/** Attach the settlement receipt header the client reads back. */
export function withPaymentResponseHeader(
  response: NextResponse,
  gate: Extract<GateResult, { ok: true }>,
) {
  const header = Buffer.from(
    JSON.stringify({
      success: true,
      transaction: gate.transaction,
      network: gate.network,
      payer: gate.payer,
    }),
  ).toString("base64");
  response.headers.set("PAYMENT-RESPONSE", header);
  return response;
}

/**
 * Generic wrapper for a fixed-price endpoint paying the platform seller.
 * Used by the /api/premium/* demo routes.
 */
export function withGateway(
  handler: (req: NextRequest) => Promise<NextResponse>,
  price: string,
  endpoint: string,
) {
  return async (req: NextRequest) => {
    try {
      const gate = await gatePayment(req, { price, payTo: sellerAddress, endpoint });
      if (!gate.ok) return gate.response;
      const response = await handler(req);
      return withPaymentResponseHeader(response, gate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[x402] Payment processing error:", message);
      return NextResponse.json({ error: "Payment processing error", message }, { status: 500 });
    }
  };
}
