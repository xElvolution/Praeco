# Praeco

<<<<<<< HEAD
**Paid by the read, not the month.** A publishing platform where a single article sells for a cent, paid instantly in USDC on Arc - settled straight to the writer, with no subscription and no floor.
=======
**Paid by the read, not the month.** A publishing platform where a single article sells for a cent, paid instantly in USDC on Arc — settled straight to the writer, with no subscription and no floor.
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971

Built for the **Lepton Agents Hackathon** (Canteen × Circle × Arc).

---

## The problem

For as long as a payment couldn't be smaller than ~30¢ after fees, there was no way to sell a 5¢ article. The only move was to bundle a month and charge $10. Every subscription is a quiet admission that the real unit was too small to sell on its own.

<<<<<<< HEAD
Circle Gateway removes that floor - gasless, batched USDC payments as small as a fraction of a cent, settled on Arc in under half a second. Praeco is what a publishing platform looks like when the smallest unit is finally sellable.
=======
Circle Gateway removes that floor — gasless, batched USDC payments as small as a fraction of a cent, settled on Arc in under half a second. Praeco is what a publishing platform looks like when the smallest unit is finally sellable.
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971

## What it does

- **Read by the lepton.** Every article is priced per read (~$0.01). One click pays the writer directly in USDC; the content unlocks.
<<<<<<< HEAD
- **No wallet friction.** A reader becomes a "citizen" with a username and a **Golden Relic** - an ancient code that encrypts a wallet minted for them. No extension, no seed phrase, no card. The relic is the only key; the database stores ciphertext only.
- **Tip, like, subscribe.** Leave a tip on top of a read, like a piece, follow a writer - all free.
- **Publish and earn.** Write a piece, set a per-read price, publish. Add collaborators and each read **splits automatically** by share. Withdraw earnings to any wallet, anytime.
- **Status you can see.** Reading and writing earn *renown*, which raises your rank (Plebeian -> Citizen -> Patrician -> Senator -> Consul) and the gold laurel wreath beside your name.
- **A paying agent.** Give the Reader-Agent a topic and a budget; it reads the catalogue, **decides** which pieces are worth the toll, pays the writers itself, and briefs you - every decision logged.
=======
- **No wallet friction.** A reader becomes a "citizen" with a username and a **Golden Relic** — an ancient code that encrypts a wallet minted for them. No extension, no seed phrase, no card. The relic is the only key; the database stores ciphertext only.
- **Tip, like, subscribe.** Leave a tip on top of a read, like a piece, follow a writer — all free.
- **Publish and earn.** Write a piece, set a per-read price, publish. Add collaborators and each read **splits automatically** by share. Withdraw earnings to any wallet, anytime.
- **Status you can see.** Reading and writing earn *renown*, which raises your rank (Plebeian → Citizen → Patrician → Senator → Consul) and the gold laurel wreath beside your name.
- **A paying agent.** Give the Reader-Agent a topic and a budget; it reads the catalogue, **decides** which pieces are worth the toll, pays the writers itself, and briefs you — every decision logged.
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971

## How payments work (the Circle/Arc stack)

| Layer | Use |
| --- | --- |
| **x402** | Every paid resource (`/api/read/[id]`, `/api/tip`, `/api/pro`) returns HTTP 402 with payment requirements; the buyer signs and retries. |
| **Circle Gateway batching** | `GatewayClient.pay()` settles gasless, batched USDC payments; `BatchFacilitatorClient` verifies + settles server-side. |
| **Custodial wallets** | Each citizen's wallet is minted + pre-funded from a treasury and its key encrypted under the relic (scrypt + AES-GCM), so paying is one click. |
| **Withdraw** | `GatewayClient.withdraw()` cashes earnings out to any address on Arc. |
| **USDC on Arc** | Native settlement; reads, tips, splits, and the Pro subscription all settle in test USDC. |

The on-chain settlement (deposits, batch settlements, withdrawals) is verifiable on the [Arc testnet explorer](https://testnet.arcscan.app); per-read authorizations are batched off-chain, which is what makes sub-cent payments economical.

## Pro

<<<<<<< HEAD
Reading, tipping, publishing, and earning are always free. **Pro** is an optional paid tier that unlocks studio writing tools (draft / improve / suggest title, teaser, price), capped per day. It's paid in USDC from the citizen's wallet - a creator-tools subscription, never a paywall on content.
=======
Reading, tipping, publishing, and earning are always free. **Pro** is an optional paid tier that unlocks studio writing tools (draft / improve / suggest title, teaser, price), capped per day. It's paid in USDC from the citizen's wallet — a creator-tools subscription, never a paywall on content.
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971

## Stack

- **Next.js 16** (App Router, React 19) · **Tailwind 4**
- **Neon** Postgres
- **Circle** `@circle-fin/x402-batching` · **viem** (`arcTestnet`)
- **OpenAI** (`gpt-4o`) for the Reader-Agent and the writing studio
- GSAP + Lenis + Framer Motion for the editorial, antiquity-themed UI

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values below

# generate the treasury/seller wallets, then fund the buyer wallet
<<<<<<< HEAD
npm run generate-wallets     # prints a buyer address -> fund at https://faucet.circle.com (Arc Testnet)

# create the database schema
node --env-file=.env.local scripts/reset.mjs
=======
npm run generate-wallets     # prints a buyer address → fund at https://faucet.circle.com (Arc Testnet)

# create the database schema + demo content
node --env-file=.env.local scripts/reset.mjs
node --env-file=.env.local scripts/seed.mjs
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971

npm run dev                  # http://localhost:3000
```

Required env in `.env.local`:

```
DATABASE_URL=postgres://…            # Neon
SELLER_PRIVATE_KEY=0x…  SELLER_ADDRESS=0x…
BUYER_PRIVATE_KEY=0x…   BUYER_ADDRESS=0x…   # treasury that pre-funds citizen wallets
PRAECO_SESSION_SECRET=…              # openssl rand -hex 32
OPENAI_API_KEY=sk-…                  # platform key for the AI features
```

## Try it

<<<<<<< HEAD
1. **Become a citizen** - pick a username, watch your Golden Relic forge, save it.
2. **Read a piece** for a lepton; tip the writer; check your wreath in the nav.
3. **Publish** something in the Studio; add a collaborator to see splits accrue.
4. **Send the agent** - `/agent`, give it a topic and a budget, watch it pay writers and brief you.
=======
1. **Become a citizen** — pick a username, watch your Golden Relic forge, save it.
2. **Read a piece** for a lepton; tip the writer; check your wreath in the nav.
3. **Publish** something in the Studio; add a collaborator to see splits accrue.
4. **Send the agent** — `/agent`, give it a topic and a budget, watch it pay writers and brief you.
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971
5. **Cash out** from your dashboard at `/me`.

## Notes

<<<<<<< HEAD
- Testnet only - all amounts are Circle **test** USDC.
- The payment rail and `/api/premium/*` test harness are derived from Circle's open-source [`arc-nanopayments`](https://github.com/circlefin/arc-nanopayments) reference (Apache-2.0); everything else - citizenship, the relic/encryption, renown and wreaths, splits, tipping, follow/like, the Reader-Agent, Pro, and the UI - is original to Praeco.
=======
- Testnet only — all amounts are Circle **test** USDC.
- The payment rail and `/api/premium/*` test harness are derived from Circle's open-source [`arc-nanopayments`](https://github.com/circlefin/arc-nanopayments) reference (Apache-2.0); everything else — citizenship, the relic/encryption, renown and wreaths, splits, tipping, follow/like, the Reader-Agent, Pro, and the UI — is original to Praeco.
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971
- The relic is the only key to an account. Lose it and the vault is sealed (as with any seed phrase); email backup is on the roadmap.

---

<<<<<<< HEAD
*The praeco was Rome's public crier, paid to carry the news. The lepton was the smallest Greek coin. Praeco pays the crier for every retelling - one lepton at a time.*
=======
*The praeco was Rome's public crier, paid to carry the news. The lepton was the smallest Greek coin. Praeco pays the crier for every retelling — one lepton at a time.*
>>>>>>> fb3f96e3d8c56746a887998217e9f1770119d971
