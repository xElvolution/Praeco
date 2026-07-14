/**
 * SiteFooter - the standing footer: brand, sitemap, and social. Used across
 * pages so every screen ends on something professional.
 * SPDX-License-Identifier: Apache-2.0
 */
import Image from "next/image";
import Link from "next/link";
import { PRAECO_MARK } from "@/lib/tiers";

const X_URL = "https://x.com/heypraeco";
const DISCORD_URL = "https://discord.gg/rsVfYutFZg";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "The Forum", href: "/read" },
      { label: "The Ledger", href: "/ledger" },
      { label: "The Arena", href: "/arena" },
      { label: "The Agent", href: "/agent" },
      { label: "Publish", href: "/studio" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "How splits work", href: "/splits" },
      { label: "Become a citizen", href: "/citizen" },
      { label: "Circle faucet", href: "https://faucet.circle.com", external: true },
      { label: "Arc explorer", href: "https://testnet.arcscan.app", external: true },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "X · @heypraeco", href: X_URL, external: true },
      { label: "Discord", href: DISCORD_URL, external: true },
      { label: "Email support", href: "mailto:support@praeco.app", external: true },
    ],
  },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.43.844-.59 1.23a18.27 18.27 0 0 0-5.487 0A12.6 12.6 0 0 0 9.89 3 19.74 19.74 0 0 0 6.13 4.37C2.68 9.46 1.75 14.42 2.21 19.31a19.9 19.9 0 0 0 6.06 3.06c.49-.67.93-1.38 1.3-2.13-.71-.27-1.4-.6-2.05-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.16 0c.16.14.33.27.5.4-.65.39-1.34.72-2.05.99.37.75.81 1.46 1.3 2.13a19.87 19.87 0 0 0 6.06-3.06c.55-5.66-.94-10.58-3.94-14.94ZM8.68 15.83c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.95 2.42-2.15 2.42Zm6.64 0c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.94 2.42-2.15 2.42Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src={PRAECO_MARK} alt="" width={32} height={32} className="rounded-full" />
              <span className="font-display text-2xl font-semibold tracking-tight text-ink">Praeco</span>
            </Link>
            <p className="mt-3 max-w-xs font-serif text-sm text-muted-foreground">
              Paid by the read, not the month. The crier is paid for every retelling,
              settled in USDC on Arc.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={X_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Praeco on X"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <XIcon />
              </a>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Praeco Discord"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <DiscordIcon />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="label-mono">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-serif text-sm text-muted-foreground transition-colors hover:text-ink"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="font-serif text-sm text-muted-foreground transition-colors hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <span className="label-mono">© 2026 Praeco · ⊙ settled on Arc</span>
          <span className="label-mono">Built on Circle × Arc</span>
        </div>
      </div>
    </footer>
  );
}
