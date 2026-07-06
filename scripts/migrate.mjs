// Runs db/schema.sql against Neon in one shot.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL");

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf-8");

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(schema); // pg simple-query protocol runs all statements
const { rows } = await client.query(
  `select table_name from information_schema.tables
   where table_schema = 'public' order by table_name`,
);
console.log("Tables:", rows.map((r) => r.table_name).join(", "));
await client.end();
console.log("Migration complete.");
