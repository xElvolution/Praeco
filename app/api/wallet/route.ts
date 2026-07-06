/**
 * Wallet API - the signed-in citizen's wallet + live balances.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextResponse } from "next/server";
import type { Hex } from "viem";
import { currentCitizen } from "@/lib/auth";
import { readerBalances } from "@/lib/treasury";

export const dynamic = "force-dynamic";

export async function GET() {
  const cit = await currentCitizen();
  if (!cit) return NextResponse.json({ exists: false });

  let gatewayAvailable = "0";
  let walletUsdc = "0";
  try {
    const bal = await readerBalances(cit.privKey as Hex);
    gatewayAvailable = bal.gateway.formattedAvailable;
    walletUsdc = bal.wallet.formatted ?? "0";
  } catch {
    /* RPC hiccup - show zeros */
  }
  return NextResponse.json({
    exists: true,
    username: cit.user.username,
    address: cit.user.wallet,
    renown: cit.user.renown,
    gatewayAvailable,
    walletUsdc,
  });
}
