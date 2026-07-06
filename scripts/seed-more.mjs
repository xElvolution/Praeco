// Seed a few varied creators + articles so the Reader-Agent has real choices.
// Usage: node --env-file=.env.local scripts/seed-more.mjs
import pg from "pg";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const creators = [
  ["homer", "Homer", "Songs carried mouth to mouth.", "0x1111111111111111111111111111111111111111"],
  ["frontinus", "Frontinus", "On aqueducts, water, and what a flow is worth.", "0x2222222222222222222222222222222222222222"],
  ["theophrastus", "Theophrastus", "Notes on plants and growing things.", "0x3333333333333333333333333333333333333333"],
];

const articles = [
  ["homer", "The Rhapsode's Wage", "rhapsodes-wage",
    "Paid by the crowd in front of him, for the performance they actually heard…",
    "The Rhapsode's Wage\n\nThe singer went town to town and was paid by the crowd in front of him — for the performance they actually heard, not a subscription to a season. Each telling was its own transaction: a few obols tossed for a tale well told. The unit of a performance is the performance; the unit of paying for it was the coin in the hand at the end.", "0.02"],
  ["frontinus", "A Grant of Water Is a Rate of Flow", "rate-of-flow",
    "A grant of water was never a volume — it was a rate, measured by the quinaria…",
    "A Grant of Water Is a Rate of Flow\n\nRome did not sell you a volume of water; it sold you a rate of flow, measured by the bore of the pipe — the quinaria. You paid for the rate at which value arrived, by the moment, continuously. Stop drawing and you stopped owing. The meter was the pipe itself.", "0.015"],
  ["theophrastus", "On the Forms of Mushrooms", "forms-of-mushrooms",
    "A plain catalogue of caps, gills, and the damp places they favour…",
    "On the Forms of Mushrooms\n\nThe fungi divide first by cap, then by gill, then by the season and the damp ground they favour. This is a catalogue, not a philosophy — useful to the forager, of little interest to the moneylender or the singer.", "0.01"],
];

for (const [handle, name, bio, wallet] of creators) {
  await c.query(
    `insert into creators (handle, name, bio, wallet) values ($1,$2,$3,$4)
     on conflict (handle) do update set name = excluded.name`,
    [handle, name, bio, wallet],
  );
}
for (const [handle, title, slug, preview, body, price] of articles) {
  const cr = await c.query(`select id from creators where handle = $1`, [handle]);
  await c.query(
    `insert into articles (creator_id, slug, title, preview, body, price_usdc)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (slug) do update set body = excluded.body, price_usdc = excluded.price_usdc`,
    [cr.rows[0].id, slug, title, preview, body, price],
  );
}

const n = await c.query(`select count(*)::int n from articles`);
console.log("Total articles now:", n.rows[0].n);
await c.end();
