// Drop all Praeco tables and rebuild from schema.sql (testnet rebuild).
// Usage: node --env-file=.env.local scripts/reset.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const tables = [
  "agent_decisions", "agent_runs", "split_earnings", "article_splits",
  "reads", "withdrawals", "payment_events", "articles",
  "app_settings", "users", "creators", "readers",
];
for (const t of tables) {
  await client.query(`drop table if exists ${t} cascade`);
}
console.log("Dropped old tables.");

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf-8");
await client.query(schema);

const { rows } = await client.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`,
);
console.log("Rebuilt:", rows.map((r) => r.table_name).join(", "));
await client.end();
