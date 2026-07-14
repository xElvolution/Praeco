/**
 * The Forum - full catalog of paid pieces. When the citizen has chosen
 * interests, pieces matching them are floated to a "For you" band; the rest
 * follow. Guests and citizens without interests just see newest-first.
 * SPDX-License-Identifier: Apache-2.0
 */
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { listArticles, type Article } from "@/lib/data";
import { currentUser } from "@/lib/auth";
import { topicLabel } from "@/lib/topics";

export const dynamic = "force-dynamic";

function matchScore(a: Article, interests: Set<string>): number {
  if (interests.size === 0) return 0;
  return (a.topics ?? []).reduce((n, t) => n + (interests.has(t) ? 1 : 0), 0);
}

export default async function ReadIndex() {
  const [articles, user] = await Promise.all([listArticles(), currentUser()]);
  const interests = new Set(user?.interests ?? []);

  const forYou = interests.size
    ? articles.filter((a) => matchScore(a, interests) > 0)
        .sort((a, b) => matchScore(b, interests) - matchScore(a, interests))
    : [];
  const forYouIds = new Set(forYou.map((a) => a.id));
  const rest = articles.filter((a) => !forYouIds.has(a.id));

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-14">
        <p className="label-mono">The Forum</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          Every piece, sold by the read
        </h1>

        {articles.length === 0 ? (
          <p className="mt-10 font-serif text-muted-foreground">
            Nothing here yet.{" "}
            <Link href="/studio" className="text-primary underline">
              Publish the first piece.
            </Link>
          </p>
        ) : (
          <>
            {forYou.length > 0 && (
              <div className="mt-10">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-semibold text-ink">For you</h2>
                  <Link href="/settings" className="label-mono transition-colors hover:text-ink">
                    edit interests
                  </Link>
                </div>
                <ArticleGrid articles={forYou} interests={interests} />
              </div>
            )}

            <div className="mt-10">
              {forYou.length > 0 && (
                <h2 className="font-display text-xl font-semibold text-ink">Everything else</h2>
              )}
              <ArticleGrid articles={rest} interests={interests} className={forYou.length > 0 ? "mt-4" : "mt-10"} />
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function ArticleGrid({
  articles,
  interests,
  className = "mt-10",
}: {
  articles: Article[];
  interests: Set<string>;
  className?: string;
}) {
  if (articles.length === 0) return null;
  return (
    <ul className={`grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 ${className}`}>
      {articles.map((a) => (
        <li key={a.id} className="bg-card">
          <Link
            href={`/a/${a.slug}`}
            className="group block h-full p-6 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center justify-between">
              <span className="label-mono">{a.creator_name}</span>
              <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                ${a.price_usdc}/read
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ink group-hover:text-primary">
              {a.title}
            </h3>
            <p className="mt-2 line-clamp-2 font-serif text-sm text-muted-foreground">
              {a.preview}
            </p>
            {a.topics?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.topics.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      interests.has(t)
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {topicLabel(t)}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 label-mono">
              {a.reads_count} reads · ${Number(a.earned_usdc).toFixed(3)} earned
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
