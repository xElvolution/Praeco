// Seed demo citizen-authors + their pieces (new account model).
// Usage: node --env-file=.env.local scripts/seed.mjs
import pg from "pg";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

function addr() {
  return privateKeyToAccount(generatePrivateKey()).address;
}

// [username, display, bio, renown]
const authors = [
  ["seneca", "Seneca", "Stoic letters, one read at a time.", 60],
  ["homer", "Homer", "Songs carried mouth to mouth.", 25],
  ["frontinus", "Frontinus", "On aqueducts, water, and what a flow is worth.", 8],
  ["theophrastus", "Theophrastus", "Notes on plants and growing things.", 2],
];

const ids = {};
for (const [username, display, bio, renown] of authors) {
  const r = await c.query(
    `insert into users (username, display_name, bio, wallet, enc_priv, renown)
     values ($1,$2,$3,$4,'seed-no-login',$5)
     on conflict (username) do update set display_name=excluded.display_name, renown=excluded.renown
     returning id`,
    [username, display, bio, addr(), renown],
  );
  ids[username] = r.rows[0].id;
}

// [author, title, slug, preview, body, price, topics]
const pieces = [
  ["seneca", "On the Shortness of Life", "on-the-shortness-of-life",
    "It is not that we have a short time to live, but that we waste a lot of it…",
    "On the Shortness of Life\n\nIt is not that we have a short time to live, but that we waste a lot of it. Life is long enough, and a sufficiently generous amount has been given to us for the highest achievements if it were all well invested.\n\nBut when it is wasted in heedless luxury and spent on no good activity, we are forced at last by death's final constraint to realize that it has passed away before we knew it was passing.", "0.01",
    ["stoicism", "philosophy"]],
  ["homer", "The Rhapsode's Wage", "rhapsodes-wage",
    "Paid by the crowd in front of him, for the performance they actually heard…",
    "The Rhapsode's Wage\n\nThe singer went town to town and was paid by the crowd in front of him — for the performance they actually heard, not a subscription to a season. Each telling was its own transaction: a few obols tossed for a tale well told.", "0.02",
    ["poetry", "economics", "history"]],
  ["frontinus", "A Grant of Water Is a Rate of Flow", "rate-of-flow",
    "A grant of water was never a volume — it was a rate, measured by the quinaria…",
    "A Grant of Water Is a Rate of Flow\n\nRome did not sell you a volume of water; it sold you a rate of flow, measured by the bore of the pipe — the quinaria. You paid for the rate at which value arrived, by the moment, continuously.", "0.015",
    ["engineering", "economics", "history"]],
  ["theophrastus", "On the Forms of Mushrooms", "forms-of-mushrooms",
    "A plain catalogue of caps, gills, and the damp places they favour…",
    "On the Forms of Mushrooms\n\nThe fungi divide first by cap, then by gill, then by the season and damp ground they favour. A catalogue, not a philosophy — useful to the forager, of little interest to the moneylender or the singer.", "0.01",
    ["nature", "science"]],
];

for (const [author, title, slug, preview, body, price, topics] of pieces) {
  await c.query(
    `insert into articles (creator_id, slug, title, preview, body, price_usdc, topics)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (slug) do update set body=excluded.body, price_usdc=excluded.price_usdc, topics=excluded.topics`,
    [ids[author], slug, title, preview, body, price, topics],
  );
}

const n = await c.query(`select count(*)::int n from articles`);
console.log("Seeded", authors.length, "citizens and", n.rows[0].n, "pieces.");
await c.end();
