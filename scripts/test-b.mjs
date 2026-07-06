// Test tipping + revenue splitting end to end. node --env-file=.env.local scripts/test-b.mjs
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { createWalletClient, createPublicClient, http, erc20Abi, parseUnits, parseEther } from "viem";
import { arcTestnet } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import pg from "pg";

const BASE = "http://localhost:3000";
const USDC = "0x3600000000000000000000000000000000000000";
const RPC = "https://rpc.testnet.arc.network";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// 1. Give an existing article a 70/30 split (author + editor).
const art = (await db.query(`select a.id, c.wallet from articles a join creators c on c.id=a.creator_id where a.slug='on-the-shortness-of-life'`)).rows[0];
await db.query(`delete from article_splits where article_id=$1`, [art.id]);
await db.query(`insert into article_splits (article_id,payee_handle,payee_wallet,share_bps) values ($1,'seneca',$2,7000),($1,'editor-livia','0x4444444444444444444444444444444444444444',3000)`, [art.id, art.wallet]);
console.log("Split article:", art.id, "→ seneca 70% / editor-livia 30%");

const homer = (await db.query(`select id from articles where slug='rhapsodes-wage'`)).rows[0];

// 2. Fund a wallet.
const funder = privateKeyToAccount(process.env.BUYER_PRIVATE_KEY);
const pub = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
const fw = createWalletClient({ account: funder, chain: arcTestnet, transport: http(RPC) });
const key = generatePrivateKey();
const acct = privateKeyToAccount(key);
await pub.waitForTransactionReceipt({ hash: await fw.sendTransaction({ to: acct.address, value: parseEther("0.03") }) });
await pub.waitForTransactionReceipt({ hash: await fw.writeContract({ address: USDC, abi: erc20Abi, functionName: "transfer", args: [acct.address, parseUnits("2", 6)] }) });
const gw = new GatewayClient({ chain: "arcTestnet", privateKey: key });
await gw.deposit("2");
console.log("Funded test wallet.");

// 3. Pay the SPLIT article read.
const readRes = await gw.pay(`${BASE}/api/read/${art.id}`, { method: "GET" });
console.log("Read split article:", readRes.formattedAmount, "USDC, status", readRes.status);

// 4. Pay a TIP on homer's piece.
const tipRes = await gw.pay(`${BASE}/api/tip/${homer.id}?amount=0.05`, { method: "GET" });
console.log("Tipped homer:", tipRes.formattedAmount, "USDC, status", tipRes.status);

// 5. Verify split_earnings accrued.
const se = (await db.query(`select payee_handle, sum(amount_usdc)::text total from split_earnings where article_id=$1 group by payee_handle order by payee_handle`, [art.id])).rows;
console.log("\nSplit earnings accrued for this article:");
se.forEach(r => console.log("  ", r.payee_handle, "→ $" + Number(r.total).toFixed(4)));
await db.end();
