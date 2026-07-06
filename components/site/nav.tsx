/**
 * Praeco top navigation - wordmark, links, and the citizen's wreath.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountMenu } from "@/components/site/account-menu";
import { SearchTrigger } from "@/components/site/user-search";
import { doLogout } from "@/app/auth-actions";
import { PRAECO_MARK } from "@/lib/tiers";

type Citizen = { username: string; renown: number; tierName: string; pro?: boolean } | null;

export function Nav() {
  const router = useRouter();
  const [citizen, setCitizen] = useState<Citizen>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/me", { cache: "no-store", signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setCitizen(d.citizen))
      .catch((e) => {
        if (e?.name !== "AbortError") setCitizen(null);
      })
      .finally(() => setLoaded(true));
    return () => ctrl.abort();
  }, []);

  async function logout() {
    await doLogout();
    setCitizen(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-parchment/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image src={PRAECO_MARK} alt="" width={32} height={32} className="rounded-full" />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tracking-tight text-ink">Praeco</span>
            <span className="label-mono hidden sm:inline">⊙ the crier</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {/* On mobile the bottom dock owns navigation - show links from md up only. */}
          <span className="hidden items-center gap-5 md:flex">
            <Link href="/read" className="text-muted-foreground transition-colors hover:text-ink">Read</Link>
            <Link href="/arena" className="text-muted-foreground transition-colors hover:text-ink">Arena</Link>
            <Link href="/agent" className="text-muted-foreground transition-colors hover:text-ink">Agent</Link>
            <Link href="/ledger" className="text-muted-foreground transition-colors hover:text-ink">Ledger</Link>
            <Link href="/studio" className="text-muted-foreground transition-colors hover:text-ink">Publish</Link>
          </span>

          <SearchTrigger compact className="mr-1" />

          {!loaded ? null : citizen ? (
            <AccountMenu
              username={citizen.username}
              renown={citizen.renown}
              tierName={citizen.tierName}
              pro={citizen.pro}
              onLogout={logout}
            />
          ) : (
            <Link
              href="/citizen"
              className="rounded-sm bg-primary px-3 py-1.5 text-primary-foreground transition-opacity hover:opacity-90"
            >
              Become a citizen
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
