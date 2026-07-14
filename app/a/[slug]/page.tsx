/**
 * Article page - public preview + the pay-to-read gate.
 * SPDX-License-Identifier: Apache-2.0
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { ReadGate } from "@/components/reader/read-gate";
import { LikeButton } from "@/components/reader/like-button";
import { Wreath } from "@/components/identity/wreath";
import { Markdown } from "@/components/reader/markdown";
import { getArticleBySlug, likeState } from "@/lib/data";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const viewer = await currentUser();
  const likes = await likeState(viewer?.id ?? null, article.id);
  const isOwner = !!viewer && viewer.id === article.creator_id;

  return (
    <div className="min-h-screen">
      <Nav />
      <article className="mx-auto max-w-2xl px-6 pb-24 pt-14">
        <Link href="/read" className="label-mono hover:text-ink">
          ← the forum
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3">
            <Link href={`/u/${article.creator_handle}`} className="flex items-center gap-1.5 hover:opacity-80">
              <Wreath renown={article.creator_renown ?? 0} size={20} variant="image" />
              <span className="label-mono">{article.creator_name}</span>
            </Link>
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
              ${article.price_usdc}/read
            </span>
            <span className="ml-auto"><LikeButton articleId={article.id} initialLiked={likes.liked} initialCount={likes.count} /></span>
          </div>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance text-ink">
            {article.title}
          </h1>
        </header>

        {/* Public preview */}
        <p className="mt-8 font-serif text-xl leading-relaxed text-ink/80 first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-primary">
          {article.preview}
        </p>

        {isOwner ? (
          <div className="mt-10">
            <div className="mb-8 flex items-center gap-3 rounded-md border border-patina/30 bg-patina/5 px-4 py-3">
              <span className="text-lg">⊙</span>
              <p className="font-mono text-xs text-patina">
                Your piece. You read it free - readers pay {article.price_usdc} USDC to unlock it.
              </p>
            </div>
            <article>
              <Markdown>{article.body}</Markdown>
            </article>
          </div>
        ) : (
          <div className="mt-10">
            <ReadGate articleId={article.id} price={article.price_usdc} />
          </div>
        )}
      </article>
    </div>
  );
}
