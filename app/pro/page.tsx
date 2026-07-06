/**
 * Praeco Pro - upgrade to unlock the AI co-writer (daily-capped).
 * SPDX-License-Identifier: Apache-2.0
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { SubscribeButton } from "@/components/pro/subscribe-button";
import { currentCitizen } from "@/lib/auth";
import { isPro, PRO_PRICE_USDC, PRO_DAILY_AI, FREE_DAILY_AI } from "@/lib/pro";

export const dynamic = "force-dynamic";

const PERKS = [
  ["More co-writer assists", `Everyone gets ${FREE_DAILY_AI} AI assists a day free. Pro raises that to ${PRO_DAILY_AI} - draft from a title, polish, and generate titles, teasers, and prices.`],
  ["A Pro laurel", "A Pro mark beside your name, so readers know you publish with the full toolset."],
  ["Priority on the roadmap", "Pro funds the platform, and Pro members shape what we build next."],
];

export default async function ProPage() {
  const cit = await currentCitizen();
  if (!cit) redirect("/citizen");
  const pro = isPro(cit.user);

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-2xl px-6 pb-24 pt-16">
        <p className="label-mono">Praeco Pro</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight text-balance text-ink">
          Better tools for writers
        </h1>
        <p className="mt-4 max-w-xl font-serif text-lg text-muted-foreground">
          The AI co-writer is free up to {FREE_DAILY_AI} assists a day. Pro raises the cap
          to {PRO_DAILY_AI} for ${PRO_PRICE_USDC} USDC a month, paid from your wallet.
        </p>

        {pro ? (
          <div className="mt-8 rounded-md border border-patina/40 bg-patina/5 p-6">
            <p className="font-display text-xl font-semibold text-ink">⊙ You&apos;re Pro</p>
            <p className="mt-1 font-serif text-muted-foreground">
              Active until {new Date(cit.user.pro_until!).toLocaleDateString()}.{" "}
              <Link href="/studio" className="text-primary underline">Open the studio →</Link>
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <SubscribeButton price={PRO_PRICE_USDC} />
            <p className="mt-2 text-xs text-muted-foreground">
              Paid in test USDC on Arc · {PRO_DAILY_AI} assists per day · cancel anytime by not renewing.
            </p>
          </div>
        )}

        <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border">
          {PERKS.map(([t, d]) => (
            <li key={t} className="bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="text-primary">⊙</span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">{t}</h2>
                  <p className="mt-1 font-serif text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 font-serif text-sm text-muted-foreground">
          Reading, tipping, publishing, and earning are always free. Pro only
          adds studio tools. No subscription is ever required to use Praeco.
        </p>
      </section>
    </div>
  );
}
