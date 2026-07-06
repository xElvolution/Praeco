// Pay a real article read end-to-end against the running dev server.
// Usage: node --env-file=.env.local scripts/test-unlock.mjs <articleId>
import { GatewayClient } from "@circle-fin/x402-batching/client";
import {
  createWalletClient, createPublicClient, http, erc20Abi, parseUnits, parseEther,
} from "viem";
import { arcTestnet } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const ARTICLE_ID = process.argv[2];
if (!ARTICLE_ID) throw new Error("pass an articleId");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const USDC = "0x3600000000000000000000000000000000000000";
const RPC = "https://rpc.testnet.arc.network";

const funder = privateKeyToAccount(process.env.BUYER_PRIVATE_KEY);
const pub = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
const fwallet = createWalletClient({ account: funder, chain: arcTestnet, transport: http(RPC) });

const key = generatePrivateKey();
const acct = privateKeyToAccount(key);
console.log("Reader wallet:", acct.address);

const gasTx = await fwallet.sendTransaction({ to: acct.address, value: parseEther("0.02") });
await pub.waitForTransactionReceipt({ hash: gasTx });
const usdcTx = await fwallet.writeContract({
  address: USDC, abi: erc20Abi, functionName: "transfer", args: [acct.address, parseUnits("1", 6)],
});
await pub.waitForTransactionReceipt({ hash: usdcTx });
console.log("Funded reader (gas + 1 USDC).");

const gateway = new GatewayClient({ chain: "arcTestnet", privateKey: key });
await gateway.deposit("1");
console.log("Deposited 1 USDC into Gateway. Paying for article...");

const result = await gateway.pay(`${BASE}/api/read/${ARTICLE_ID}`, { method: "GET" });
console.log("\n--- PAID ---");
console.log("amount   :", result.formattedAmount, "USDC");
console.log("tx       :", result.transaction);
console.log("status   :", result.status);
console.log("title    :", result.data?.title);
console.log("body[0:80]:", String(result.data?.body).slice(0, 80), "...");
console.log("\nexplorer : https://testnet.arcscan.app/tx/" + result.transaction);
