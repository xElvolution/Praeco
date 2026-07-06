/**
 * /me - the citizen's dashboard: status, earnings breakdown, who paid you,
 * wallet + withdraw, and your pieces. Self-explanatory via inline ⓘ notes.
 * SPDX-License-Identifier: Apache-2.0
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Hex } from "viem";
import { Nav } from "@/components/site/nav";
import { Wreath } from "@/components/identity/wreath";
import { MoneyPanel } from "@/components/account/money-panel";
import { ClientelaPanel } from "@/components/account/clientela-panel";
import { LaurelsChest } from "@/components/identity/laurels-chest";
import { Info } from "@/components/ui/info";
import { currentCitizen } from "@/lib/auth";
import { readerBalances } from "@/lib/treasury";
import { listArticlesByCreator, creatorEarnings, recentPatrons, claimedQuests, referralStats, followerCount, followingCount } from "@/lib/data";
import { tierForRenown, nextTier } from "@/lib/tiers";
import { badgesFor } from "@/lib/badges";
import { ARC_EXPLORER } from "@/lib/arc";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default async function MePage() {
  const cit = await currentCitizen();
  if (!cit) redirect("/citizen");
  const { user } = cit;
  const tier = tierForRenown(user.renown);
  const next = nextTier(user.renown);

  let gatewayAvailable = "0";
  let walletUsdc = "0";
  try {
    const bal = await readerBalances(cit.privKey as Hex);
    gatewayAvailable = bal.gateway.formattedAvailable;
    walletUsdc = bal.wallet.formatted ?? "0";
  } catch {
    /* RPC hiccup */
  }
  const [pieces, earn, patrons, claimed, referrals, followers, followingN] = await Promise.all([
    listArticlesByCreator(user.id),
    creatorEarnings(user.id, user.username),
    recentPatrons(user.username, 10),
    claimedQuests(user.id),
    referralStats(user.id),
    followerCount(user.id),
    followingCount(user.id),
  ]);
  const badges = badgesFor(user.renown, new Set(claimed));
  const identityStats = [
    { v: String(followers), l: followers === 1 ? "follower" : "followers" },
    { v: String(followingN), l: "following" },
    { v: String(pieces.length), l: pieces.length === 1 ? "article" : "articles" },
    { v: String(user.renown), l: "renown" },
  ];

  const totalEarned = Number(earn.total_earned || 0);
  const progressPct = next
    ? Math.min(100, Math.round(((user.renown - tier.min) / (next.min - tier.min)) * 100))
    : 100;

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        {/* Identity + rank */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Wreath renown={user.renown} size={64} variant="image" />
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{user.display_name}</h1>
              <p className="label-mono mt-1">
                @{user.username} · {tier.name}
                <Info text="Your rank. Renown grows each time you read a piece or get read. Higher renown means a fuller gold laurel wreath and a higher rank: Plebeian → Citizen → Patrician → Senator → Consul." />
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/u/${user.username}`} className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary">Public profile</Link>
            <Link href="/profile" className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary">Edit</Link>
          </div>
        </div>

        {/* Follower / following / articles / renown */}
        <div className="mt-6 grid grid-cols-4 overflow-hidden rounded-lg border border-border bg-card">
          {identityStats.map((s, i) => (
            <div key={s.l} className={`px-4 py-3.5 text-center ${i > 0 ? "border-l border-border" : ""}`}>
              <div className="font-display text-xl font-semibold tabular-nums text-ink sm:text-2xl">{s.v}</div>
              <div className="label-mono mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Rank progress */}
        <div className="mt-4 rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between label-mono">
            <span>{tier.name} · {user.renown} renown</span>
            <Link href="/arena" className="text-primary hover:underline">{next ? `${next.min - user.renown} to ${next.name}` : "highest rank"} →</Link>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Headline totals - the two numbers that matter, kept up top */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          <div className="bg-card px-6 py-5">
            <div className="label-mono">spendable now<Info text="USDC in Circle Gateway you can spend on reads or withdraw instantly. Your purse (Fiscus) manages it." /></div>
            <div className="mt-1 font-display text-3xl font-semibold tabular-nums text-primary">${Number(gatewayAvailable).toFixed(4)}</div>
          </div>
          <div className="bg-card px-6 py-5">
            <div className="label-mono">lifetime earned<Info text="Everything readers have paid for your pieces, all-time, in USDC." /></div>
            <div className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">${totalEarned.toFixed(4)}</div>
          </div>
        </div>

        {/* Money - Fiscus / Aerarium toggle */}
        <MoneyPanel
          wallet={user.wallet}
          explorerHref={`${ARC_EXPLORER}/address/${user.wallet}`}
          spendable={gatewayAvailable}
          loose={walletUsdc}
          totalEarned={totalEarned}
          tips={String(earn.tips ?? 0)}
          reads={Number(earn.reads_received ?? 0)}
          subscribers={Number(earn.followers ?? 0)}
        />

        {/* Clientela - referral guild */}
        <div className="mt-6">
          <ClientelaPanel
            username={user.username}
            invited={referrals.invited}
            active={referrals.active}
            rewards={referrals.rewards}
          />
        </div>

        {/* Laurels - earned honors */}
        <div className="mt-6">
          <LaurelsChest badges={badges} self />
        </div>

        {/* Who paid you */}
        <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-[inset_0_1px_0_hsl(var(--card-foreground)/0.04)]">
          <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <IconCoins />
              <h2 className="font-display text-lg font-semibold text-ink">Who paid you</h2>
            </div>
            <span className="label-mono">{patrons.length ? `${patrons.length} recent` : "the ledger"}</span>
          </header>
          {patrons.length === 0 ? (
            <EmptyWell
              icon={<IconCoins large />}
              title="No patrons yet"
              body="When a reader pays to unlock your work, it lands here - the amount, the piece, and when. Every payment is on-chain and provable."
              cta={{ href: "/studio", label: "Publish a piece →" }}
            />
          ) : (
            <ul>
              {patrons.map((p, i) => (
                <li key={i} className="flex items-center justify-between border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-secondary/30">
                  <div className="min-w-0">
                    <span className="font-serif text-ink">{String(p.reader_handle)}</span>
                    {p.is_tip ? <span className="ml-2 rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary">tip</span> : null}
                    {p.is_agent ? <span className="ml-2 rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">agent</span> : null}
                    <span className="label-mono"> · {String(p.article_title)}</span>
                  </div>
                  <span className="shrink-0 pl-3 text-right">
                    <span className="font-mono text-sm text-ink">⊙ ${Number(p.amount_usdc).toFixed(3)}</span>
                    <span className="label-mono ml-2">{timeAgo(String(p.created_at))}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pieces */}
        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-[inset_0_1px_0_hsl(var(--card-foreground)/0.04)]">
          <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <IconQuill />
              <h2 className="font-display text-lg font-semibold text-ink">Your pieces</h2>
            </div>
            {pieces.length > 0 && (
              <Link href="/studio" className="label-mono transition-colors hover:text-ink">+ new</Link>
            )}
          </header>
          {pieces.length === 0 ? (
            <EmptyWell
              icon={<IconQuill large />}
              title="Your rostrum is empty"
              body="Publish your first piece - set a price per read, add collaborators if you like, and every unlock pays your wallet the moment it settles."
              cta={{ href: "/studio", label: "Open the Studio →" }}
            />
          ) : (
            <ul>
              {pieces.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-secondary/30">
                  <Link href={`/a/${p.slug}`} className="truncate font-serif text-ink hover:text-primary">{p.title}</Link>
                  <span className="label-mono shrink-0 pl-4">{p.reads_count} reads · ${Number(p.earned_usdc).toFixed(3)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}

/** A centered empty state for a carded section - icon, headline, copy, CTA. */
function EmptyWell({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary ring-1 ring-primary/15">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="max-w-xs font-serif text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link
        href={cta.href}
        className="mt-1 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function IconCoins({ large }: { large?: boolean }) {
  const s = large ? 24 : 17;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={large ? "" : "text-primary"} aria-hidden>
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v5c0 1.66 2.69 3 6 3" />
      <path d="M3 12v5c0 1.66 2.69 3 6 3 1.02 0 1.98-.13 2.83-.35" />
      <circle cx="16.5" cy="14.5" r="4.5" />
      <path d="M16.5 12.7v3.6M15 14.5h3" />
    </svg>
  );
}

function IconQuill({ large }: { large?: boolean }) {
  const s = large ? 24 : 17;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={large ? "" : "text-primary"} aria-hidden>
      <path d="M20 4C11 6 7.5 10.5 5 20" />
      <path d="M20 4c-1 7-5 11-13 12" />
      <path d="M5 20c-.5-3 .5-6 3-8" />
      <path d="M4 21c0-1 .3-2 .8-3" />
    </svg>
  );
}
