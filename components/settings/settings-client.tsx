/**
 * Settings - Theme · Profile · Notifications, with sign out.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditProfileForm } from "@/components/account/edit-profile-form";
import { THEMES, applyTheme, getTheme, type ThemeKey } from "@/lib/theme";
import { TOPICS } from "@/lib/topics";
import { saveInterestsAction } from "@/app/profile-actions";
import { doLogout, doRegenerateRelic, doDeleteAccount } from "@/app/auth-actions";

type Tab = "profile" | "interests" | "theme" | "notifications" | "security" | "support";

const NOTIFS = [
  { key: "subscriber", label: "New subscriber", sub: "when someone follows you" },
  { key: "paid", label: "A read or tip", sub: "when someone pays for your piece" },
  { key: "following", label: "New pieces", sub: "from creators you follow" },
];

const DEFAULT_NOTIFS = { subscriber: true, paid: true, following: true };

// Preferences live in localStorage; this tiny store lets React subscribe to
// them so toggles re-render immediately (and hydration stays consistent).
const prefListeners = new Set<() => void>();
function subscribePrefs(cb: () => void) {
  prefListeners.add(cb);
  return () => prefListeners.delete(cb);
}
function emitPrefs() {
  prefListeners.forEach((l) => l());
}

let notifsCache: Record<string, boolean> = DEFAULT_NOTIFS;
let notifsCacheRaw: string | null = null;
function readStoredNotifs(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem("praeco-notifs");
    if (saved !== notifsCacheRaw) {
      notifsCacheRaw = saved;
      notifsCache = saved ? JSON.parse(saved) : DEFAULT_NOTIFS;
    }
  } catch {
    /* ignore */
  }
  return notifsCache;
}

export function SettingsClient({
  profileInitial,
  interestsInitial = [],
}: {
  profileInitial: { displayName: string; bio: string; twitter: string; email: string; discord: string };
  interestsInitial?: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const theme = useSyncExternalStore(subscribePrefs, getTheme, () => "day" as ThemeKey);
  const notifs = useSyncExternalStore(subscribePrefs, readStoredNotifs, () => DEFAULT_NOTIFS);
  const [interests, setInterests] = useState<string[]>(interestsInitial);
  const [savingInterests, startSaveInterests] = useTransition();

  function toggleInterest(key: string) {
    const next = interests.includes(key)
      ? interests.filter((k) => k !== key)
      : [...interests, key];
    setInterests(next);
    startSaveInterests(async () => {
      const res = await saveInterestsAction(next);
      if (res.ok) toast.success("Interests saved.");
      else toast.error(res.error ?? "Could not save.");
      router.refresh();
    });
  }

  function pickTheme(k: ThemeKey) {
    applyTheme(k);
    emitPrefs();
  }
  function toggleNotif(k: string) {
    const next = { ...notifs, [k]: !notifs[k] };
    try {
      localStorage.setItem("praeco-notifs", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    emitPrefs();
    toast.success("Preference saved.");
  }
  async function signOut() {
    await doLogout();
    router.push("/");
    router.refresh();
  }

  const [newRelic, setNewRelic] = useState<string | null>(null);
  const [relicBusy, setRelicBusy] = useState(false);
  const [relicCopied, setRelicCopied] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function backupRelic() {
    setRelicBusy(true);
    const res = await doRegenerateRelic();
    setRelicBusy(false);
    if (res.ok) {
      setNewRelic(res.relic);
      toast.success("A new relic is forged. Save it now.");
    } else {
      toast.error("Could not forge a new relic. Try again.");
    }
  }

  function copyRelic() {
    if (!newRelic) return;
    navigator.clipboard?.writeText(newRelic);
    setRelicCopied(true);
    toast.success("Relic copied.");
    setTimeout(() => setRelicCopied(false), 1600);
  }

  async function removeAccount() {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Type DELETE to confirm.');
      return;
    }
    setDeleteBusy(true);
    const res = await doDeleteAccount();
    setDeleteBusy(false);
    if (res.ok) {
      toast.success("Your account has been deleted.");
      router.push("/");
      router.refresh();
    } else {
      toast.error("Could not delete your account. Try again.");
    }
  }

  return (
    <div className="mt-8 grid gap-8 sm:grid-cols-[160px_1fr]">
      {/* Tab rail */}
      <nav className="flex gap-2 sm:flex-col">
        {(["profile", "interests", "theme", "notifications", "security", "support"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-sm px-3 py-2 text-left text-sm capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
        <button onClick={signOut} className="mt-2 rounded-sm px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-secondary">
          Sign out
        </button>
      </nav>

      {/* Panels */}
      <div>
        {tab === "theme" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Theme</h2>
            <p className="mt-1 font-serif text-sm text-muted-foreground">Choose the world you read in.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => pickTheme(t.key)}
                  className={`rounded-md border p-4 text-left transition-colors ${
                    theme === t.key ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
                  }`}
                >
                  <div className="font-display text-base font-semibold text-ink">{t.name}</div>
                  <div className="label-mono mt-1">{t.note}</div>
                  {theme === t.key && <div className="mt-2 font-mono text-xs text-primary">✓ active</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "interests" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Interests</h2>
            <p className="mt-1 font-serif text-sm text-muted-foreground">
              The Forum leads with pieces that match. {savingInterests && <span className="text-primary">saving…</span>}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {TOPICS.map((t) => {
                const on = interests.includes(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleInterest(t.key)}
                    aria-pressed={on}
                    title={t.blurb}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-ink hover:border-primary/50 hover:bg-secondary/60"
                    }`}
                  >
                    {on && <span className="mr-1">✓</span>}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Profile</h2>
            <p className="mt-1 font-serif text-sm text-muted-foreground">How you appear to readers.</p>
            <div className="mt-5">
              <EditProfileForm initial={profileInitial} />
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Notifications</h2>
            <p className="mt-1 font-serif text-sm text-muted-foreground">What you want to hear about.</p>
            <ul className="mt-5 overflow-hidden rounded-md border border-border bg-card">
              {NOTIFS.map((n) => (
                <li key={n.key} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
                  <div>
                    <div className="font-serif text-ink">{n.label}</div>
                    <div className="label-mono">{n.sub}</div>
                  </div>
                  <button
                    onClick={() => toggleNotif(n.key)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${notifs[n.key] ? "bg-primary" : "bg-secondary"}`}
                    aria-pressed={notifs[n.key]}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-all ${notifs[n.key] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "security" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Security</h2>
            <p className="mt-1 font-serif text-sm text-muted-foreground">
              Your relic is the only key to your vault and wallet. Keep a backup somewhere safe.
            </p>

            {/* Relic backup */}
            <div className="mt-5 rounded-md border border-border bg-card p-5">
              <div className="font-display text-base font-semibold text-ink">Back up your relic</div>
              <p className="mt-1 font-serif text-sm text-muted-foreground">
                Forge a fresh relic and save it. This becomes your new key - the old
                relic stops working. We never store it in readable form, so write it
                down the moment it appears.
              </p>
              {newRelic ? (
                <div className="mt-4">
                  <div className="rounded-md border border-primary/40 bg-primary/5 p-4">
                    <div className="label-mono mb-2">your new relic</div>
                    <code className="block break-all font-mono text-sm text-ink">{newRelic}</code>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={copyRelic}
                      className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {relicCopied ? "✓ copied" : "Copy relic"}
                    </button>
                    <button
                      onClick={() => setNewRelic(null)}
                      className="rounded-sm border border-border px-4 py-2 text-sm text-ink transition-colors hover:bg-secondary"
                    >
                      I&apos;ve saved it
                    </button>
                  </div>
                  <p className="mt-2 font-serif text-xs text-muted-foreground">
                    Store it in a password manager. Anyone with this relic can open your vault.
                  </p>
                </div>
              ) : (
                <button
                  onClick={backupRelic}
                  disabled={relicBusy}
                  className="mt-4 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {relicBusy ? "Forging…" : "Forge a new relic"}
                </button>
              )}
            </div>

            {/* Delete account */}
            <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/5 p-5">
              <div className="font-display text-base font-semibold text-destructive">Delete account</div>
              <p className="mt-1 font-serif text-sm text-muted-foreground">
                This permanently removes your account, your pieces, and your activity.
                Your custodial wallet key is destroyed with it - move out any balance
                first. This cannot be undone.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="min-w-0 flex-1 rounded-sm border border-border bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-destructive"
                />
                <button
                  onClick={removeAccount}
                  disabled={deleteBusy || confirmText.trim().toUpperCase() !== "DELETE"}
                  className="shrink-0 rounded-sm bg-destructive px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteBusy ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "support" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Support</h2>
            <p className="mt-1 font-serif text-sm text-muted-foreground">Stuck, or have a question? We&apos;re here.</p>
            <ul className="mt-5 space-y-3">
              <li className="rounded-md border border-border bg-card p-4">
                <a href="/arena" className="font-display text-base font-semibold text-ink hover:text-primary">The Arena →</a>
                <p className="mt-1 font-serif text-sm text-muted-foreground">Climb the cursus honorum. Quests explain how Praeco works.</p>
              </li>
              <li className="rounded-md border border-border bg-card p-4">
                <a href="mailto:support@praeco.app" className="font-display text-base font-semibold text-ink hover:text-primary">Email support →</a>
                <p className="mt-1 font-serif text-sm text-muted-foreground">Reach the team directly. We aim to reply within a day.</p>
              </li>
              <li className="rounded-md border border-border bg-card p-4">
                <a href="https://discord.gg/rsVfYutFZg" target="_blank" rel="noreferrer" className="font-display text-base font-semibold text-ink hover:text-primary">Community Discord →</a>
                <p className="mt-1 font-serif text-sm text-muted-foreground">Ask questions and meet other writers and readers.</p>
              </li>
              <li className="rounded-md border border-border bg-card p-4">
                <button onClick={() => setTab("security")} className="font-display text-base font-semibold text-ink hover:text-primary">Back up your relic →</button>
                <p className="mt-1 font-serif text-sm text-muted-foreground">The relic is the only key to your vault and cannot be recovered if lost. Forge a fresh backup any time under Security.</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
