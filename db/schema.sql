-- Praeco schema (Neon Postgres) — account-centric rebuild.
-- One `users` account both reads and publishes. Private keys encrypted at rest.
-- SPDX-License-Identifier: Apache-2.0

-- A citizen. `wallet` is their on-chain address; `enc_priv` is the relic-encrypted
-- private key (never stored in clear). `renown` drives their status tier.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  username text not null unique,
  display_name text not null,
  bio text,
  wallet text not null unique,
  enc_priv text not null,
  renown integer not null default 0,
  is_agent boolean not null default false
);

-- A paid piece. body is gated; preview is public.
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  creator_id uuid not null references users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  preview text not null default '',
  body text not null,
  cover text,
  price_usdc text not null default '0.01',
  reads_count integer not null default 0,
  earned_usdc numeric not null default 0
);

-- One row per paid unlock or tip. Powers the Ledger.
create table if not exists reads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  article_id uuid references articles(id) on delete cascade,
  creator_id uuid references users(id) on delete set null,
  reader_id uuid references users(id) on delete set null,
  reader_handle text not null default 'anon',
  reader_wallet text not null,
  creator_handle text not null,
  article_title text not null,
  amount_usdc text not null,
  gateway_tx text,
  is_agent boolean not null default false,
  is_tip boolean not null default false
);

-- Low-level x402 settlement log.
create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  endpoint text not null,
  payer text not null,
  amount_usdc text not null,
  network text not null,
  gateway_tx text,
  raw jsonb
);

-- Cash-outs from Gateway to an external wallet.
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references users(id) on delete set null,
  amount_usdc text not null,
  destination_chain text not null,
  destination_address text not null,
  status text not null default 'submitted',
  tx_hash text
);

-- Reader-Agent runs + decision log.
create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic text not null,
  budget_usdc numeric not null,
  spent_usdc numeric not null default 0,
  wallet text,
  synthesis text,
  status text not null default 'running'
);
create table if not exists agent_decisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  article_id uuid references articles(id) on delete set null,
  article_title text not null,
  creator_handle text not null,
  decision text not null,
  reason text not null,
  relevance integer not null default 0,
  amount_usdc text,
  gateway_tx text
);

-- Revenue splits: one read fans out to N payees by share.
create table if not exists article_splits (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  payee_handle text not null,
  payee_wallet text not null,
  share_bps integer not null
);
create table if not exists split_earnings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  article_id uuid references articles(id) on delete set null,
  payee_handle text not null,
  payee_wallet text not null,
  amount_usdc numeric not null
);

-- Editable app settings (e.g. the OpenAI key).
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Profile social links (added to users).
alter table users add column if not exists twitter text;
alter table users add column if not exists email text;
alter table users add column if not exists discord text;

-- Reader interests, chosen in the welcome flow — used to personalize the Forum.
alter table users add column if not exists interests text[] not null default '{}';

-- Topics a writer tags a piece with — matched against reader interests.
alter table articles add column if not exists topics text[] not null default '{}';

-- Clientela: who invited this citizen (the patron). Set once at signup via ?ref.
alter table users add column if not exists referred_by uuid references users(id) on delete set null;

-- Referral rewards: a patron earns a cut when a citizen they invited pays for
-- something that creates value (currently: a Pro subscription → 10%).
create table if not exists referral_earnings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  referrer_id uuid not null references users(id) on delete cascade,
  referee_id uuid not null references users(id) on delete cascade,
  kind text not null,
  amount_usdc numeric not null,
  tx_hash text
);
create index if not exists referral_earnings_referrer_idx on referral_earnings (referrer_id);

-- Pro subscription: unlocks the AI writing tools with a daily creation cap.
alter table users add column if not exists pro_until timestamptz;
alter table users add column if not exists ai_count integer not null default 0;
alter table users add column if not exists ai_date date;

-- Arena / Cursus Honorum: bound external wallet, daily streak, claimed quests.
alter table users add column if not exists bound_wallet text;
alter table users add column if not exists streak integer not null default 0;
alter table users add column if not exists daily_date date;

create table if not exists quest_claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references users(id) on delete cascade,
  quest_key text not null,
  unique (user_id, quest_key)
);

-- Follows: a citizen subscribes to a creator's new pieces (free).
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  follower_id uuid not null references users(id) on delete cascade,
  creator_id uuid not null references users(id) on delete cascade,
  unique (follower_id, creator_id)
);

-- Likes on a piece.
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references users(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  unique (user_id, article_id)
);

create index if not exists follows_creator_idx on follows (creator_id);
create index if not exists likes_article_idx on likes (article_id);
create index if not exists reads_created_idx on reads (created_at desc);
create index if not exists articles_creator_idx on articles (creator_id);
create index if not exists agent_decisions_run_idx on agent_decisions (run_id, created_at);
create index if not exists splits_article_idx on article_splits (article_id);
create index if not exists split_earnings_wallet_idx on split_earnings (payee_wallet);
