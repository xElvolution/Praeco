/**
 * Landing - the Praeco showpiece. A numbered, scroll-driven editorial narrative:
 * 00 The Crier · 01 The Floor · 02 ΛΕΠΤΟΝ · 03 The Toll · 04 The Ledger · 05 The Forum.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SmoothScroll } from "@/components/animations/smooth-scroll";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";
import { LeptonCoin } from "@/components/landing/lepton-coin";
import { LedgerFeed } from "@/components/ledger/ledger-feed";
import { ScrollFX } from "@/components/animations/scroll-fx";
import { Nav } from "@/components/site/nav";
import { ScrollRelics } from "@/components/site/scroll-relics";

type Article = {
  id: string;
  slug: string;
  title: string;
  preview: string;
  price_usdc: string;
  reads_count: number;
  earned_usdc: string;
  creator_name?: string;
};
type Totals = {
  total_reads: number;
  total_usdc: string;
  unique_readers: number;
  creators_paid: number;
};
type Read = Parameters<typeof LedgerFeed>[0]["initialReads"][number];

function Chapter({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <span data-parallax="22" className="font-mono text-sm text-primary">{n}</span>
      <span className="rule flex-1" />
      <span className="label-mono">{title}</span>
    </div>
  );
}

export function Landing({
  articles,
  totals,
  reads,
}: {
  articles: Article[];
  totals: Totals;
  reads: Read[];
}) {
  const usdc = Number(totals.total_usdc || 0);

  return (
    <SmoothScroll>
      <div className="relative z-10 min-h-screen">
        <ScrollRelics />
        <ScrollFX />
        <Nav />

        {/* 00 · THE CRIER */}
        <section data-relic="crier" className="relative mx-auto grid max-w-5xl items-center gap-10 px-6 pb-20 pt-16 md:grid-cols-[1.2fr_1fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="label-mono"
            >
              Lepton · ΛΕΠΤΟΝ · the smallest coin, reborn for machines
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="mt-4 font-display text-6xl font-semibold leading-[0.92] tracking-tight text-balance text-ink sm:text-7xl"
            >
              The crier is paid<br />for <span className="italic text-primary">every</span> retelling.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16 }}
              className="mt-6 max-w-md font-serif text-lg leading-relaxed text-muted-foreground"
            >
              A single article, sold by the read, a lepton at a time. Each read
              settles in USDC on Arc in under half a second, straight to the
              writer. No subscription. No floor.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link href="/read" className="rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Enter the forum
              </Link>
              <Link href="/ledger" className="rounded-sm border border-border px-5 py-2.5 font-medium text-ink transition-colors hover:bg-secondary">
                Watch the ledger →
              </Link>
            </motion.div>
          </div>

          <div className="flex justify-center">
            <LeptonCoin size={260} />
          </div>
        </section>

        {/* live counters */}
        <section data-relic="crier" className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
            {[
              { v: <Counter to={totals.total_reads} />, l: "reads paid" },
              { v: <Counter to={usdc} prefix="$" decimals={4} />, l: "USDC to writers" },
              { v: <Counter to={totals.creators_paid} />, l: "creators paid" },
              { v: <Counter to={totals.unique_readers} />, l: "readers" },
            ].map((s, i) => (
              <div key={i} className="bg-card px-5 py-5">
                <div className="font-display text-3xl font-semibold text-ink">{s.v}</div>
                <div className="label-mono mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 01 · THE FLOOR */}
        <section data-relic="floor" className="mx-auto max-w-3xl px-6 py-20">
          <Chapter n="01" title="The Floor" />
          <ScrollReveal>
            <p className="font-display text-3xl font-medium leading-snug text-balance text-ink sm:text-4xl">
              For as long as a payment couldn&apos;t be smaller than{" "}
              <span className="text-primary">roughly thirty cents</span>, there was
              no way to sell a five-cent article. The only move was to bundle a
              month and charge ten dollars.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mt-6 font-serif text-lg text-muted-foreground">
              Every subscription is a quiet admission that the real unit was too
              small to sell on its own.
            </p>
          </ScrollReveal>
        </section>

        {/* 02 · ΛΕΠΤΟΝ */}
        <section data-relic="lepton" className="mx-auto max-w-3xl px-6 py-20">
          <Chapter n="02" title="ΛΕΠΤΟΝ · the smallest coin" />
          <ScrollReveal>
            <p className="font-serif text-lg leading-relaxed text-ink">
              The lepton was the smallest coin of the Greek world, a hundredth of a
              drachma, struck so ordinary people could pay for everyday things. The
              widow&apos;s two mites were lepta. Nanopayments are the lepton reborn:
              value as small as <span className="font-mono text-primary">$0.000001</span>,
              clearing in under half a second.
            </p>
          </ScrollReveal>
        </section>

        {/* 03 · THE TOLL */}
        <section data-relic="toll" className="mx-auto max-w-5xl px-6 py-20">
          <Chapter n="03" title="The Toll · how a read is paid" />
          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
            {[
              { k: "i", t: "A reader arrives", d: "We mint them a free testnet wallet and pre-load it. No card, no crypto, no signup wall. One name and they are in." },
              { k: "ii", t: "They pay a lepton", d: "One click sends ~$0.01 in USDC over Circle Gateway, gasless and batched, settled on Arc in under 500ms." },
              { k: "iii", t: "The writer is paid", d: "The toll lands in the creator's wallet and the read is carved into the public Ledger, forever." },
            ].map((s) => (
              <ScrollReveal key={s.k} className="bg-card p-6">
                <div className="font-mono text-sm text-primary">{s.k}</div>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.t}</h3>
                <p className="mt-2 font-serif text-sm text-muted-foreground">{s.d}</p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* 04 · THE LEDGER */}
        <section data-relic="ledger" className="mx-auto max-w-3xl px-6 py-20">
          <Chapter n="04" title="The Ledger · every lepton, on the record" />
          <ScrollReveal>
            <LedgerFeed initialReads={reads} initialTotals={totals} />
          </ScrollReveal>
        </section>

        {/* 05 · THE FORUM */}
        <section data-relic="forum" className="mx-auto max-w-5xl px-6 py-20">
          <Chapter n="05" title="The Forum · pieces sold by the read" />
          {articles.length === 0 ? (
            <p className="font-serif text-muted-foreground">
              No pieces yet.{" "}
              <Link href="/studio" className="text-primary underline">Publish the first.</Link>
            </p>
          ) : (
            <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
              {articles.map((a) => (
                <li key={a.id} className="bg-card">
                  <Link href={`/a/${a.slug}`} className="group block h-full p-6 transition-colors hover:bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <span className="label-mono">{a.creator_name}</span>
                      <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">${a.price_usdc}/read</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ink group-hover:text-primary">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 font-serif text-sm text-muted-foreground">{a.preview}</p>
                    <p className="mt-4 label-mono">{a.reads_count} reads · ${Number(a.earned_usdc).toFixed(3)} earned</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer */}
        <footer data-relic="forum" className="rule mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <span className="font-display text-2xl font-semibold text-ink">Praeco</span>
            <span className="label-mono">⊙ the crier is paid for every retelling · settled on Arc</span>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
