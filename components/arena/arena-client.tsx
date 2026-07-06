/**
 * ArenaClient - the cursus honorum UI: tier ladder, quests, daily treasure,
 * wallet bind. Guest mode previews the ladder; citizens play for renown.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { claimQuestAction, bindWalletAction, claimDailyAction } from "@/app/arena-actions";

type LadderTier = { key: string; name: string; min: number; image: string; gold: string };

type Quest = {
  key: string;
  title: string;
  detail: string;
  renown: number;
  goal: number;
  progress: number;
  done: boolean;
  claimed: boolean;
  award: number;
  href: string | null;
};

type Citizen = {
  username: string;
  displayName: string;
  renown: number;
  boundWallet: string | null;
  tier: LadderTier;
  next: { name: string; min: number } | null;
  boosts: { pro: boolean; socials: boolean; mult: number };
};

type Daily = { streak: number; claimedToday: boolean; award: number };

const ROMAN = ["I", "II", "III", "IV", "V"];

function TierLadder({ ladder, activeKey }: { ladder: LadderTier[]; activeKey?: string }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {ladder.map((t, i) => {
        const active = t.key === activeKey;
        const reached = activeKey
          ? ladder.findIndex((x) => x.key === activeKey) >= i
          : false;
        return (
          <div
            key={t.key}
            className={`flex flex-col items-center rounded-md border p-2 text-center transition-colors sm:p-3 ${
              active ? "border-primary bg-primary/5" : reached ? "border-border bg-card" : "border-border/60 bg-card/50 opacity-70"
            }`}
          >
            <Image src={t.image} alt={t.name} width={56} height={56} className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
            <div className="mt-1.5 font-mono text-[0.55rem] text-muted-foreground sm:text-[0.6rem]">{ROMAN[i]}</div>
            <div className="mt-0.5 font-display text-[0.65rem] font-semibold leading-tight text-ink sm:text-xs">{t.name}</div>
            <div className="label-mono mt-0.5 text-[0.55rem]">{t.min}+</div>
          </div>
        );
      })}
    </div>
  );
}

function QuestCard({
  quest,
  onClaim,
  busy,
  onBind,
}: {
  quest: Quest;
  busy: string | null;
  onClaim: (key: string) => void;
  onBind: (address: string) => void;
}) {
  const [wallet, setWallet] = useState("");
  const pct = Math.round((quest.progress / quest.goal) * 100);

  return (
    <li className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink">{quest.title}</h3>
          <p className="mt-1 font-serif text-sm leading-relaxed text-muted-foreground">{quest.detail}</p>
        </div>
        <span className="shrink-0 rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
          +{quest.award} renown
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between label-mono">
          <span>{quest.progress} / {quest.goal}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {quest.claimed ? (
          <span className="label-mono text-primary">claimed ✓</span>
        ) : quest.done ? (
          <button
            type="button"
            onClick={() => onClaim(quest.key)}
            disabled={!!busy}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === quest.key ? "Claiming…" : "Claim renown"}
          </button>
        ) : quest.key === "bind_wallet" ? (
          <form
            className="flex w-full flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onBind(wallet.trim());
            }}
          >
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x your wallet address"
              className="min-w-0 flex-1 rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs text-ink outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={!!busy || wallet.trim().length < 10}
              className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-50"
            >
              {busy === "bind" ? "Binding…" : "Bind seal"}
            </button>
          </form>
        ) : quest.href ? (
          <Link href={quest.href} className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-secondary">
            Go →
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function ArenaClient({
  ladder,
  guest,
  citizen,
  quests = [],
  daily,
}: {
  ladder: LadderTier[];
  guest?: boolean;
  citizen?: Citizen;
  quests?: Quest[];
  daily?: Daily;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [claimedOverride, setClaimedOverride] = useState(false);
  const dailyClaimed = (daily?.claimedToday ?? false) || claimedOverride;

  async function claim(key: string) {
    setBusy(key);
    const res = await claimQuestAction(key);
    setBusy(null);
    if (res.ok) {
      toast.success(`+${res.award} renown earned.`);
      router.refresh();
    } else if (res.error === "NOT_CITIZEN") {
      router.push("/citizen");
    } else toast.error(res.error);
  }

  async function bind(address: string) {
    setBusy("bind");
    const res = await bindWalletAction(address);
    setBusy(null);
    if (res.ok) {
      toast.success("Wallet bound. Claim your renown when ready.");
      router.refresh();
    } else toast.error(res.error);
  }

  async function claimDaily() {
    if (dailyClaimed || busy === "daily") return;
    setBusy("daily");
    const res = await claimDailyAction();
    if (res.ok) {
      setClaimedOverride(true);
      toast.success(`Daily treasure: +${res.award} renown · ${res.streak} day streak.`);
    } else {
      if (res.error === "Already claimed today.") setClaimedOverride(true);
      toast.error(res.error ?? "Already claimed today.");
    }
    setBusy(null);
    if (res.ok) router.refresh();
  }

  const progressPct =
    citizen?.next
      ? Math.min(100, Math.round(((citizen.renown - citizen.tier.min) / (citizen.next.min - citizen.tier.min)) * 100))
      : 100;

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-14">
      <p className="label-mono">The Arena · cursus honorum</p>
      <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight text-balance text-ink">
        Climb the ranks
      </h1>
      <p className="mt-4 max-w-xl font-serif text-lg text-muted-foreground">
        Every read, publish, tip, and follower earns renown. Complete quests to rise from
        Plebeian to Consul, and wear your medallion everywhere on Praeco.
      </p>

      {/* Tier ladder */}
      <div className="mt-10">
        <h2 className="label-mono mb-4">The five ranks</h2>
        <TierLadder ladder={ladder} activeKey={citizen?.tier.key} />
      </div>

      {guest ? (
        <div className="mt-12 rounded-md border border-border bg-card p-8 text-center">
          <p className="font-serif text-muted-foreground">
            Become a citizen to enter the Arena: forge your relic, earn renown, and claim quests.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/citizen" className="rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">
              Become a citizen
            </Link>
            <Link href="/read" className="rounded-sm border border-border px-6 py-3 font-medium text-ink hover:bg-secondary">
              Browse the forum →
            </Link>
          </div>
        </div>
      ) : citizen ? (
        <>
          {/* Citizen status */}
          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-md border border-border bg-card p-5">
            <Image src={citizen.tier.image} alt={citizen.tier.name} width={72} height={72} className="h-16 w-16 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-semibold text-ink">{citizen.displayName}</div>
              <div className="label-mono mt-1">
                {citizen.tier.name} · {citizen.renown} renown
                {citizen.next && <> · {citizen.next.min - citizen.renown} to {citizen.next.name}</>}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          {/* Boosts */}
          {(citizen.boosts.pro || citizen.boosts.socials) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {citizen.boosts.pro && (
                <span className="rounded-sm bg-primary/10 px-2 py-1 font-mono text-xs text-primary">Pro 1.5× renown</span>
              )}
              {citizen.boosts.socials && (
                <span className="rounded-sm bg-primary/10 px-2 py-1 font-mono text-xs text-primary">Socials 1.25× renown</span>
              )}
            </div>
          )}

          {/* Daily treasure */}
          {daily && (
            <div className="mt-8 rounded-md border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Daily treasure</h2>
                  <p className="mt-1 font-serif text-sm text-muted-foreground">
                    Return each day. {daily.streak > 0 ? `${daily.streak} day streak.` : "Start your streak today."}
                  </p>
                </div>
                {(dailyClaimed || daily.claimedToday) ? (
                  <span className="label-mono text-primary">claimed today ✓</span>
                ) : (
                  <button
                    type="button"
                    onClick={claimDaily}
                    disabled={!!busy || dailyClaimed}
                    className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === "daily" ? "Claiming…" : `Claim +${daily.award} renown`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quests */}
          <div className="mt-10">
            <h2 className="label-mono mb-4">Quests · learn Praeco by doing</h2>
            <ul className="space-y-3">
              {quests.map((q) => (
                <QuestCard key={q.key} quest={q} busy={busy} onClaim={claim} onBind={bind} />
              ))}
            </ul>
          </div>

          {citizen.boundWallet && (
            <p className="mt-6 label-mono">
              bound seal · <span className="font-mono normal-case tracking-normal">{citizen.boundWallet.slice(0, 8)}…{citizen.boundWallet.slice(-6)}</span>
            </p>
          )}
        </>
      ) : null}

      <Explainer />
    </section>
  );
}

const STEPS: [string, string, string][] = [
  ["01", "Become a citizen", "Pick a name and Praeco forges you a Golden Relic - an ancient code that is your only key. It also mints a wallet, pre-loaded with test USDC. Login is name + relic, nothing else."],
  ["02", "Read a piece for a lepton", "Every article is sold by the read - about a cent. The toll leaves your wallet and reaches the writer in under a second, settled on Arc."],
  ["03", "Tip, like, subscribe", "Loved it? Leave a tip on top of the read. Tap the heart to like. Subscribe to follow a writer's new work - all free, all optional."],
  ["04", "Publish and earn", "Write a piece with the AI co-writer, set a per-read price, publish. Every read pays your wallet. Collaborators are paid by automatic splits."],
  ["05", "Send the agent to read for you", "Give the autonomous Reader-Agent a topic and a budget. It reads the catalogue, decides what to pay for, pays the writers itself, and briefs you."],
  ["06", "Wear your laurel", "Every read given or received earns renown. Renown raises your rank - Plebeian → Consul - and the laurel beside your name grows fuller."],
];

function Explainer() {
  return (
    <div className="rule mt-16 pt-10">
      <p className="label-mono">Explained in the Arena</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
        The whole of Praeco, in six moves
      </h2>
      <ol className="mt-8 space-y-6">
        {STEPS.map(([n, t, d]) => (
          <li key={n} className="flex gap-5">
            <span className="shrink-0 font-mono text-sm text-primary">{n}</span>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">{t}</h3>
              <p className="mt-1 font-serif leading-relaxed text-muted-foreground">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
