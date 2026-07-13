/**
 * Resolve the app's own origin for server-side fetches (x402 payment calls hit
 * our own API routes). In production the old `http://localhost:3000` default
 * made every server-action fetch fail; derive the real host from the request
 * instead, with env overrides for cron/agent contexts that have no request.
 * SPDX-License-Identifier: Apache-2.0
 */
import { headers } from "next/headers";

/** Best-effort origin: explicit env, then request host, then Vercel, then local. */
export async function getBaseUrl(): Promise<string> {
  const env = process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* no request context (agent/cron) - fall through to env */
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
