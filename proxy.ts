/**
 * Praeco middleware. Most of the app is public (reading, the Ledger). Creator
 * auth will gate /studio later; for now this is a pass-through.
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextResponse, type NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
