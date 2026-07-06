/**
 * Editable app settings, stored in Neon. Used for the OpenAI key the user can
 * set from the site. DB value wins over the env fallback.
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import { sql } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  try {
    const rows = (await sql`select value from app_settings where key = ${key}`) as { value: string }[];
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    insert into app_settings (key, value, updated_at)
    values (${key}, ${value}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/** The OpenAI key: DB setting first, then env. */
export async function getOpenAIKey(): Promise<string | null> {
  return (await getSetting("openai_api_key")) || process.env.OPENAI_API_KEY || null;
}
