/**
 * Data-access layer for Praeco (Neon Postgres), account-centric.
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import { sql } from "./db";
import { dateKey } from "./utils";

export type User = {
  id: string;
  created_at?: string;
  username: string;
  display_name: string;
  bio: string | null;
  wallet: string;
  enc_priv: string;
  renown: number;
  is_agent: boolean;
  twitter: string | null;
  email: string | null;
  discord: string | null;
  pro_until: string | null;
  ai_count: number;
  ai_date: string | Date | null;
  bound_wallet: string | null;
  streak: number;
  daily_date: string | Date | null;
  interests: string[] | null;
  referred_by: string | null;
};

/** Live counts of a citizen's activity, for evaluating quest progress. */
export async function citizenStats(userId: string, username: string) {
  const rows = (await sql`
    select
      (select count(*) from reads where reader_id = ${userId} and not is_tip)::int as reads_given,
      (select count(*) from reads where reader_id = ${userId} and is_tip)::int as tips_given,
      (select count(*) from articles where creator_id = ${userId})::int as pieces,
      (select count(*) from follows where creator_id = ${userId})::int as subscribers,
      (select count(*) from likes where user_id = ${userId})::int as likes_given
  `) as Record<string, number>[];
  void username;
  return rows[0];
}

export async function claimedQuests(userId: string): Promise<string[]> {
  const rows = (await sql`select quest_key from quest_claims where user_id = ${userId}`) as { quest_key: string }[];
  return rows.map((r) => r.quest_key);
}

/** Record a quest claim (idempotent). Returns true if newly claimed. */
export async function claimQuest(userId: string, key: string): Promise<boolean> {
  const rows = (await sql`
    insert into quest_claims (user_id, quest_key) values (${userId}, ${key})
    on conflict do nothing returning id`) as { id: string }[];
  return rows.length > 0;
}

export async function bindWallet(userId: string, wallet: string) {
  await sql`update users set bound_wallet = ${wallet} where id = ${userId}`;
}

/** True when the citizen already claimed today's daily treasure (Postgres calendar date). */
export async function claimedDailyToday(userId: string): Promise<boolean> {
  const rows = (await sql`
    select (daily_date = current_date) as claimed from users where id = ${userId}
  `) as { claimed: boolean }[];
  return !!rows[0]?.claimed;
}

/**
 * Claim daily treasure once per calendar day - atomic. Returns streak when newly
 * claimed, null if already claimed today (no renown must be awarded).
 */
export async function claimDailyTreasure(userId: string): Promise<{ streak: number } | null> {
  const rows = (await sql`
    update users
    set streak = case
          when daily_date = current_date - 1 then streak + 1
          else 1 end,
        daily_date = current_date
    where id = ${userId}
      and (daily_date is null or daily_date < current_date)
    returning streak
  `) as { streak: number }[];
  return rows[0] ?? null;
}

export type Article = {
  id: string;
  created_at: string;
  creator_id: string;
  slug: string;
  title: string;
  preview: string;
  body: string;
  cover: string | null;
  price_usdc: string;
  reads_count: number;
  earned_usdc: string;
  topics: string[];
  creator_handle?: string;
  creator_name?: string;
  creator_wallet?: string;
  creator_renown?: number;
};

export type Read = {
  id: string;
  created_at: string;
  article_id: string | null;
  article_title: string;
  creator_handle: string;
  reader_handle: string;
  reader_wallet: string;
  amount_usdc: string;
  gateway_tx: string | null;
  is_agent: boolean;
  is_tip: boolean;
  creator_renown: number;
  reader_renown: number;
};

// --- users / citizens ---
export async function createUser(u: {
  username: string;
  displayName: string;
  bio?: string;
  wallet: string;
  encPriv: string;
  isAgent?: boolean;
}): Promise<User> {
  const rows = (await sql`
    insert into users (username, display_name, bio, wallet, enc_priv, is_agent, renown)
    values (${u.username}, ${u.displayName}, ${u.bio ?? null}, ${u.wallet}, ${u.encPriv}, ${u.isAgent ?? false}, 1)
    returning *`) as User[];
  return rows[0];
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = (await sql`select * from users where id = ${id}`) as User[];
  return rows[0] ?? null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = (await sql`select * from users where username = ${username}`) as User[];
  return rows[0] ?? null;
}

/** Re-seal a user's wallet key under a new relic (relic regeneration). */
export async function updateEncPriv(userId: string, encPriv: string) {
  await sql`update users set enc_priv = ${encPriv} where id = ${userId}`;
}

/** Permanently delete a user. Foreign keys cascade to their content + activity. */
export async function deleteUser(userId: string) {
  await sql`delete from users where id = ${userId}`;
}

export async function bumpRenown(userId: string, by = 1) {
  await sql`update users set renown = renown + ${by} where id = ${userId}`;
}

/** Grant/extend Pro until a timestamp. */
export async function setProUntil(userId: string, untilIso: string) {
  await sql`update users set pro_until = ${untilIso} where id = ${userId}`;
}

/**
 * Atomically consume one daily AI credit if under the cap. Resets the count on
 * a new day. Returns whether it was allowed and how many remain after.
 */
export async function consumeAiCredit(
  userId: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const rows = (await sql`
    update users
    set ai_count = case when ai_date = current_date then ai_count + 1 else 1 end,
        ai_date = current_date
    where id = ${userId}
      and (ai_date is distinct from current_date or ai_count < ${limit})
    returning ai_count`) as { ai_count: number }[];
  if (rows.length === 0) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: Math.max(0, limit - rows[0].ai_count) };
}

/** AI credits remaining today (without consuming). */
export function aiRemaining(user: User, limit: number): number {
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = dateKey(user.ai_date) === today ? user.ai_count : 0;
  return Math.max(0, limit - usedToday);
}

export async function updateProfile(
  userId: string,
  p: { displayName: string; bio: string; twitter: string; email: string; discord: string },
) {
  await sql`
    update users set display_name = ${p.displayName}, bio = ${p.bio || null},
      twitter = ${p.twitter || null}, email = ${p.email || null}, discord = ${p.discord || null}
    where id = ${userId}`;
}

// --- follows ---
export async function followCreator(followerId: string, creatorId: string) {
  if (followerId === creatorId) return;
  await sql`insert into follows (follower_id, creator_id) values (${followerId}, ${creatorId}) on conflict do nothing`;
}
export async function unfollowCreator(followerId: string, creatorId: string) {
  await sql`delete from follows where follower_id = ${followerId} and creator_id = ${creatorId}`;
}
export async function isFollowing(followerId: string, creatorId: string): Promise<boolean> {
  const rows = (await sql`select 1 from follows where follower_id = ${followerId} and creator_id = ${creatorId} limit 1`) as unknown[];
  return rows.length > 0;
}
export async function followerCount(creatorId: string): Promise<number> {
  const rows = (await sql`select count(*)::int n from follows where creator_id = ${creatorId}`) as { n: number }[];
  return rows[0].n;
}
export async function followingCount(followerId: string): Promise<number> {
  const rows = (await sql`select count(*)::int n from follows where follower_id = ${followerId}`) as { n: number }[];
  return rows[0].n;
}

/**
 * Search citizens by @username or display name for the global search overlay.
 * Case-insensitive prefix/substring match, richest (highest renown) first.
 */
export async function searchUsers(
  q: string,
  limit = 8,
): Promise<{ username: string; display_name: string; renown: number; pieces: number }[]> {
  const term = q.trim();
  if (term.length < 1) return [];
  const like = `%${term.replace(/[%_]/g, (m) => "\\" + m)}%`;
  return (await sql`
    select u.username, u.display_name, u.renown,
           (select count(*) from articles a where a.creator_id = u.id)::int as pieces
    from users u
    where not u.is_agent
      and (u.username ilike ${like} escape '\\' or u.display_name ilike ${like} escape '\\')
    order by u.renown desc, u.username asc
    limit ${limit}
  `) as { username: string; display_name: string; renown: number; pieces: number }[];
}

// --- clientela (referrals) ---
/** Set the patron who referred a citizen - once, at signup, never self. */
export async function setReferredBy(userId: string, referrerId: string) {
  if (userId === referrerId) return;
  await sql`update users set referred_by = ${referrerId} where id = ${userId} and referred_by is null`;
}

/** Record a referral reward (e.g. a 10% cut of a referee's Pro payment). */
export async function recordReferralEarning(e: {
  referrerId: string;
  refereeId: string;
  kind: string;
  amountUsdc: string;
  txHash: string | null;
}) {
  await sql`
    insert into referral_earnings (referrer_id, referee_id, kind, amount_usdc, tx_hash)
    values (${e.referrerId}, ${e.refereeId}, ${e.kind}, ${e.amountUsdc}, ${e.txHash})`;
}

/**
 * A patron's clientela stats: how many they invited, how many became "active"
 * (published a piece or subscribed to Pro), and total rewards earned.
 */
export async function referralStats(userId: string): Promise<{
  invited: number;
  active: number;
  rewards: string;
}> {
  const rows = (await sql`
    select
      (select count(*) from users where referred_by = ${userId})::int as invited,
      (select count(*) from users u where u.referred_by = ${userId}
         and (
           exists (select 1 from articles a where a.creator_id = u.id)
           or (u.pro_until is not null and u.pro_until > now())
         ))::int as active,
      coalesce((select sum(amount_usdc) from referral_earnings where referrer_id = ${userId}), 0) as rewards
  `) as { invited: number; active: number; rewards: string }[];
  const r = rows[0];
  return { invited: r.invited, active: r.active, rewards: String(r.rewards) };
}

// --- likes ---
export async function likeArticle(userId: string, articleId: string) {
  await sql`insert into likes (user_id, article_id) values (${userId}, ${articleId}) on conflict do nothing`;
}
export async function unlikeArticle(userId: string, articleId: string) {
  await sql`delete from likes where user_id = ${userId} and article_id = ${articleId}`;
}
export async function likeState(userId: string | null, articleId: string): Promise<{ count: number; liked: boolean }> {
  const c = (await sql`select count(*)::int n from likes where article_id = ${articleId}`) as { n: number }[];
  let liked = false;
  if (userId) {
    const l = (await sql`select 1 from likes where user_id = ${userId} and article_id = ${articleId} limit 1`) as unknown[];
    liked = l.length > 0;
  }
  return { count: c[0].n, liked };
}

// --- creator dashboard earnings ---
export async function creatorEarnings(creatorId: string, username: string) {
  const rows = (await sql`
    select
      coalesce((select sum(earned_usdc) from articles where creator_id = ${creatorId}),0)::text as total_earned,
      coalesce((select sum(amount_usdc::numeric) from reads where creator_handle = ${username} and is_tip),0)::text as tips,
      coalesce((select count(*) from reads where creator_handle = ${username} and not is_tip),0)::int as reads_received,
      coalesce((select count(*) from reads where creator_handle = ${username} and is_agent),0)::int as agent_reads,
      coalesce((select count(distinct reader_wallet) from reads where creator_handle = ${username}),0)::int as patrons,
      (select count(*) from follows where creator_id = ${creatorId})::int as followers
  `) as Record<string, string | number>[];
  return rows[0];
}

/** Recent people who paid this creator (for the dashboard feed). */
export async function recentPatrons(username: string, limit = 12) {
  return (await sql`
    select reader_handle, amount_usdc, article_title, is_tip, is_agent, gateway_tx, created_at
    from reads where creator_handle = ${username}
    order by created_at desc limit ${limit}`) as Record<string, unknown>[];
}

// --- articles ---
export async function createArticle(a: {
  creatorId: string;
  slug: string;
  title: string;
  preview: string;
  body: string;
  cover?: string;
  priceUsdc: string;
  topics?: string[];
}): Promise<Article> {
  const rows = (await sql`
    insert into articles (creator_id, slug, title, preview, body, cover, price_usdc, topics)
    values (${a.creatorId}, ${a.slug}, ${a.title}, ${a.preview}, ${a.body}, ${a.cover ?? null}, ${a.priceUsdc}, ${a.topics ?? []})
    returning *`) as Article[];
  return rows[0];
}

/** Save a reader's chosen interests (topic keys). Used to personalize the Forum. */
export async function saveInterests(userId: string, interests: string[]) {
  await sql`update users set interests = ${interests} where id = ${userId}`;
}

/**
 * Creators worth suggesting to a fresh citizen: writers with at least one
 * published piece, richest first by renown, excluding the citizen themselves.
 */
export async function listSuggestedCreators(
  excludeUserId: string,
  limit = 6,
): Promise<{ id: string; username: string; display_name: string; bio: string | null; renown: number; pieces: number }[]> {
  return (await sql`
    select u.id, u.username, u.display_name, u.bio, u.renown,
           count(a.id)::int as pieces
    from users u
    join articles a on a.creator_id = u.id
    where u.id <> ${excludeUserId} and not u.is_agent
    group by u.id
    order by (u.username = 'elvolution') desc, u.renown desc, pieces desc
    limit ${limit}
  `) as { id: string; username: string; display_name: string; bio: string | null; renown: number; pieces: number }[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const rows = (await sql`
    select a.*, u.username as creator_handle, u.display_name as creator_name,
           u.wallet as creator_wallet, u.renown as creator_renown
    from articles a join users u on u.id = a.creator_id
    where a.slug = ${slug}`) as Article[];
  return rows[0] ?? null;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const rows = (await sql`
    select a.*, u.username as creator_handle, u.display_name as creator_name,
           u.wallet as creator_wallet, u.renown as creator_renown
    from articles a join users u on u.id = a.creator_id
    where a.id = ${id}`) as Article[];
  return rows[0] ?? null;
}

export async function listArticles(): Promise<Article[]> {
  return (await sql`
    select a.*, u.username as creator_handle, u.display_name as creator_name,
           u.wallet as creator_wallet, u.renown as creator_renown
    from articles a join users u on u.id = a.creator_id
    order by a.created_at desc`) as Article[];
}

export async function listArticlesByCreator(creatorId: string): Promise<Article[]> {
  return (await sql`select * from articles where creator_id = ${creatorId} order by created_at desc`) as Article[];
}

/** Bump an article's read stats and credit the creator's renown. */
export async function bumpArticleStats(articleId: string, amountUsdc: string, creatorId?: string) {
  await sql`
    update articles set reads_count = reads_count + 1,
      earned_usdc = earned_usdc + ${amountUsdc}::numeric where id = ${articleId}`;
  if (creatorId) await bumpRenown(creatorId, 1);
}

// --- reads (the Ledger) ---
export async function recordRead(r: {
  articleId: string;
  creatorId: string | null;
  readerId: string | null;
  readerHandle: string;
  readerWallet: string;
  creatorHandle: string;
  articleTitle: string;
  amountUsdc: string;
  gatewayTx: string | null;
  isAgent: boolean;
  isTip?: boolean;
}) {
  await sql`
    insert into reads (article_id, creator_id, reader_id, reader_handle, reader_wallet,
                       creator_handle, article_title, amount_usdc, gateway_tx, is_agent, is_tip)
    values (${r.articleId}, ${r.creatorId}, ${r.readerId}, ${r.readerHandle}, ${r.readerWallet},
            ${r.creatorHandle}, ${r.articleTitle}, ${r.amountUsdc}, ${r.gatewayTx}, ${r.isAgent}, ${r.isTip ?? false})`;
}

export async function listReads(limit = 80): Promise<Read[]> {
  return (await sql`
    select r.id, r.created_at, r.article_id, r.article_title, r.creator_handle, r.reader_handle,
           r.reader_wallet, r.amount_usdc, r.gateway_tx, r.is_agent, r.is_tip,
           coalesce(uc.renown, 0) as creator_renown,
           coalesce(ur.renown, 0) as reader_renown
    from reads r
    left join users uc on uc.username = r.creator_handle
    left join users ur on ur.username = r.reader_handle
    order by r.created_at desc limit ${limit}`) as Read[];
}

/** Ledger entries where the given citizen is either the reader or the creator. */
export async function listReadsForUser(username: string, limit = 80): Promise<Read[]> {
  return (await sql`
    select r.id, r.created_at, r.article_id, r.article_title, r.creator_handle, r.reader_handle,
           r.reader_wallet, r.amount_usdc, r.gateway_tx, r.is_agent, r.is_tip,
           coalesce(uc.renown, 0) as creator_renown,
           coalesce(ur.renown, 0) as reader_renown
    from reads r
    left join users uc on uc.username = r.creator_handle
    left join users ur on ur.username = r.reader_handle
    where r.creator_handle = ${username} or r.reader_handle = ${username}
    order by r.created_at desc limit ${limit}`) as Read[];
}

export type LeaderRow = {
  handle: string;
  display_name: string;
  renown: number;
  reads: number;
  tips: number;
  amount: number;
  is_agent?: boolean;
};

/**
 * The Hall of Laurels leaderboard. `kind` = "creators" (ranked by value earned)
 * or "patrons" (ranked by value given). `sinceIso` bounds the window (null = all
 * time). Impact is derived by the caller from reads + tips.
 */
export async function leaderboard(
  kind: "creators" | "patrons",
  sinceIso: string | null,
  limit = 10,
): Promise<LeaderRow[]> {
  if (kind === "creators") {
    return (await sql`
      select r.creator_handle as handle,
             coalesce(u.display_name, r.creator_handle) as display_name,
             coalesce(u.renown, 0) as renown,
             coalesce(u.is_agent, false) as is_agent,
             count(*) filter (where not r.is_tip)::int as reads,
             count(*) filter (where r.is_tip)::int as tips,
             coalesce(sum(r.amount_usdc::numeric), 0)::float8 as amount
      from reads r
      left join users u on u.username = r.creator_handle
      where (${sinceIso}::timestamptz is null or r.created_at >= ${sinceIso}::timestamptz)
      group by r.creator_handle, u.display_name, u.renown, u.is_agent
      order by amount desc, reads desc
      limit ${limit}`) as LeaderRow[];
  }
  return (await sql`
    select r.reader_handle as handle,
           coalesce(u.display_name, r.reader_handle) as display_name,
           coalesce(u.renown, 0) as renown,
           coalesce(u.is_agent, false) as is_agent,
           count(*) filter (where not r.is_tip)::int as reads,
           count(*) filter (where r.is_tip)::int as tips,
           coalesce(sum(r.amount_usdc::numeric), 0)::float8 as amount
    from reads r
    left join users u on u.username = r.reader_handle
    where r.reader_handle <> 'anon'
      and (${sinceIso}::timestamptz is null or r.created_at >= ${sinceIso}::timestamptz)
    group by r.reader_handle, u.display_name, u.renown, u.is_agent
    order by amount desc, reads desc
    limit ${limit}`) as LeaderRow[];
}

export async function ledgerTotals() {
  const rows = (await sql`
    select count(*)::int as total_reads,
           coalesce(sum(amount_usdc::numeric),0)::text as total_usdc,
           count(distinct reader_wallet)::int as unique_readers,
           count(distinct creator_handle)::int as creators_paid
    from reads`) as {
    total_reads: number; total_usdc: string; unique_readers: number; creators_paid: number;
  }[];
  return rows[0];
}

// --- payment_events ---
export async function recordPaymentEvent(e: {
  endpoint: string; payer: string; amountUsdc: string;
  network: string; gatewayTx: string | null; raw: unknown;
}) {
  try {
    await sql`
      insert into payment_events (endpoint, payer, amount_usdc, network, gateway_tx, raw)
      values (${e.endpoint}, ${e.payer}, ${e.amountUsdc}, ${e.network}, ${e.gatewayTx}, ${JSON.stringify(e.raw)})`;
  } catch (err) {
    console.error("recordPaymentEvent failed:", (err as Error).message);
  }
}

// --- revenue splits ---
export type Split = {
  id: string; article_id: string; payee_handle: string;
  payee_wallet: string; share_bps: number;
};

export async function createArticleSplits(
  articleId: string,
  splits: { handle: string; wallet: string; shareBps: number }[],
) {
  for (const s of splits) {
    await sql`insert into article_splits (article_id, payee_handle, payee_wallet, share_bps)
              values (${articleId}, ${s.handle}, ${s.wallet}, ${s.shareBps})`;
  }
}

export async function getArticleSplits(articleId: string): Promise<Split[]> {
  return (await sql`select * from article_splits where article_id = ${articleId} order by share_bps desc`) as Split[];
}

export async function recordSplitEarning(e: {
  articleId: string; payeeHandle: string; payeeWallet: string; amountUsdc: string;
}) {
  await sql`insert into split_earnings (article_id, payee_handle, payee_wallet, amount_usdc)
            values (${e.articleId}, ${e.payeeHandle}, ${e.payeeWallet}, ${e.amountUsdc})`;
}

export async function splitEarningsSummary() {
  return (await sql`
    select payee_handle, payee_wallet, coalesce(sum(amount_usdc),0)::text as total, count(*)::int as payments
    from split_earnings group by payee_handle, payee_wallet order by sum(amount_usdc) desc`) as {
    payee_handle: string; payee_wallet: string; total: string; payments: number;
  }[];
}

export async function listSplitArticles() {
  const arts = (await sql`
    select distinct a.id, a.title, a.slug from articles a
    join article_splits s on s.article_id = a.id order by a.title`) as
    { id: string; title: string; slug: string }[];
  const out = [];
  for (const a of arts) out.push({ ...a, splits: await getArticleSplits(a.id) });
  return out;
}

// --- agent runs ---
export async function createAgentRun(r: { topic: string; budget: string; wallet: string }) {
  const rows = (await sql`
    insert into agent_runs (topic, budget_usdc, wallet) values (${r.topic}, ${r.budget}, ${r.wallet})
    returning id`) as { id: string }[];
  return rows[0];
}
export async function finishAgentRun(id: string, spent: string, synthesis: string) {
  await sql`update agent_runs set spent_usdc = ${spent}, synthesis = ${synthesis}, status = 'done' where id = ${id}`;
}
export async function recordAgentDecision(d: {
  runId: string; articleId: string | null; articleTitle: string; creatorHandle: string;
  decision: "pay" | "skip"; reason: string; relevance: number;
  amountUsdc: string | null; gatewayTx: string | null;
}) {
  await sql`insert into agent_decisions (run_id, article_id, article_title, creator_handle, decision, reason, relevance, amount_usdc, gateway_tx)
            values (${d.runId}, ${d.articleId}, ${d.articleTitle}, ${d.creatorHandle}, ${d.decision}, ${d.reason}, ${d.relevance}, ${d.amountUsdc}, ${d.gatewayTx})`;
}
export async function getAgentRun(id: string) {
  const runs = (await sql`select * from agent_runs where id = ${id}`) as Record<string, unknown>[];
  if (!runs[0]) return null;
  const decisions = await sql`select * from agent_decisions where run_id = ${id} order by relevance desc, created_at`;
  return { run: runs[0], decisions };
}
export async function listAgentRuns(limit = 20) {
  return (await sql`select id, created_at, topic, budget_usdc, spent_usdc, status from agent_runs order by created_at desc limit ${limit}`) as Record<string, unknown>[];
}

