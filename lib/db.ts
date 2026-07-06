/**
 * Neon Postgres client for Praeco. Use the `sql` tagged template for queries:
 *   const rows = await sql`select * from articles where slug = ${slug}`;
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL (Neon connection string)");
}

neonConfig.fetchConnectionCache = true;

const inner = neon(process.env.DATABASE_URL);

function isTransientDbError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err);
  const code =
    (err as { sourceError?: { cause?: { code?: string } } })?.sourceError?.cause?.code ?? "";
  return (
    msg.includes("fetch failed") ||
    msg.includes("Connect Timeout") ||
    msg.includes("ECONNRESET") ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransientDbError(e) || i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw last;
}

export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  withRetry(() => inner(strings, ...values))) as typeof inner;
