/**
 * Public creator profile - a proper citizen's plaque: laurel, rank, a stat
 * band drawn from real activity, cursus-honorum progress, and their pieces.
 * SPDX-License-Identifier: Apache-2.0
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { Wreath } from "@/components/identity/wreath";
import { FollowButton } from "@/components/account/follow-button";
import { LaurelsChest } from "@/components/identity/laurels-chest";
import { currentUser } from "@/lib/auth";
import {
  getUserByUsername,
  listArticlesByCreator,
  followerCount,
  followingCount,
  isFollowing,
  claimedQuests,
} from "@/lib/data";
import { isPro } from "@/lib/pro";
import { tierForRenown, nextTier } from "@/lib/tiers";
import { badgesFor } from "@/lib/badges";

export const dynamic = "force-dynamic";

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const [pieces, followers, followingN, claimed, viewer] = await Promise.all([
    listArticlesByCreator(user.id),
    followerCount(user.id),
    followingCount(user.id),
    claimedQuests(user.id),
    currentUser(),
  ]);
  const following = viewer ? await isFollowing(viewer.id, user.id) : false;
  const isSelf = viewer?.id === user.id;
  const tier = tierForRenown(user.renown);
  const next = nextTier(user.renown);
  const pro = isPro(user);
  const badges = badgesFor(user.renown, new Set(claimed));

  const totalEarned = pieces.reduce((n, p) => n + Number(p.earned_usdc || 0), 0);
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;
  const progressPct = next
    ? Math.min(100, Math.round(((user.renown - tier.min) / (next.min - tier.min)) * 100))
    : 100;

  const socials: { label: string; href: string | null; text: string }[] = [];
  if (user.twitter) socials.push({ label: "𝕏", href: `https://x.com/${user.twitter}`, text: `@${user.twitter}` });
  if (user.email) socials.push({ label: "✉", href: `mailto:${user.email}`, text: user.email });
  if (user.discord) socials.push({ label: "Discord", href: null, text: user.discord });

  const stats: { v: string; l: string }[] = [
    { v: String(followers), l: followers === 1 ? "follower" : "followers" },
    { v: String(followingN), l: "following" },
    { v: String(pieces.length), l: pieces.length === 1 ? "article" : "articles" },
    { v: String(user.renown), l: "renown" },
  ];

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-10 md:pt-14">
        {/* Hero plaque */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.06]">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="shrink-0 rounded-full bg-primary/5 p-1 ring-1 ring-primary/15">
                  <Wreath renown={user.renown} size={80} variant="image" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                      {user.display_name}
                    </h1>
                    {pro && (
                      <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="label-mono mt-1.5 normal-case tracking-normal">@{user.username}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs"
                      style={{ borderColor: `${tier.gold}55`, color: tier.gold }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.gold }} />
                      {tier.name}
                    </span>
                    {joined && <span className="label-mono">since {joined}</span>}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {isSelf ? (
                  <Link href="/profile" className="rounded-sm border border-border px-4 py-2 text-sm text-ink transition-colors hover:bg-secondary">
                    Edit profile
                  </Link>
                ) : (
                  <FollowButton username={user.username} initialFollowing={following} initialCount={followers} />
                )}
              </div>
            </div>

            {user.bio && <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-ink/85">{user.bio}</p>}

            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {socials.map((s) =>
                  s.href ? (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded-sm border border-border bg-card px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:bg-secondary">
                      {s.label} {s.text}
                    </a>
                  ) : (
                    <span key={s.label} className="rounded-sm border border-border bg-card px-3 py-1.5 font-mono text-xs text-ink">
                      {s.label} {s.text}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Stat band */}
          <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.l}
                className={`px-5 py-4 text-center ${i > 0 ? "border-l border-border" : ""} ${i === 2 ? "border-t border-border sm:border-t-0" : ""} ${i === 3 ? "border-t border-border sm:border-t-0" : ""}`}
              >
                <div className="font-display text-2xl font-semibold tabular-nums text-ink">{s.v}</div>
                <div className="label-mono mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cursus honorum progress */}
        <Link
          href="/arena"
          className="mt-4 block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between label-mono">
            <span>Cursus honorum</span>
            <span className="text-primary">
              {next ? `${next.min - user.renown} renown to ${next.name} →` : "at the summit →"}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
          </div>
        </Link>

        {/* Laurels */}
        <div className="mt-8">
          <LaurelsChest badges={badges} self={isSelf} />
        </div>

        {/* Pieces */}
        <section className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3.5">
            <h2 className="font-display text-lg font-semibold text-ink">Pieces</h2>
            <span className="label-mono">
              {pieces.length ? `${pieces.length} · $${totalEarned.toFixed(3)} earned` : "the rostrum"}
            </span>
          </header>
          {pieces.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                {isSelf ? "Your rostrum is empty" : "No pieces yet"}
              </p>
              <p className="max-w-xs font-serif text-sm text-muted-foreground">
                {isSelf
                  ? "Publish your first piece and every read pays your wallet."
                  : `${user.display_name} hasn't published yet. Follow to hear the first word.`}
              </p>
              {isSelf && (
                <Link href="/studio" className="mt-1 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  Open the Studio →
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-px bg-border sm:grid-cols-2">
              {pieces.map((p) => (
                <li key={p.id} className="bg-card">
                  <Link href={`/a/${p.slug}`} className="group block h-full p-5 transition-colors hover:bg-secondary/40">
                    <div className="flex items-center justify-between">
                      <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">${p.price_usdc}/read</span>
                      <span className="label-mono">{p.reads_count} reads</span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-ink group-hover:text-primary">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 font-serif text-sm text-muted-foreground">{p.preview}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}
