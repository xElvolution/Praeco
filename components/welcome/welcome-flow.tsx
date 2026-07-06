/**
 * WelcomeFlow - two rites for a new citizen: pick interests, follow voices.
 * Both are optional and both are real. Interests save to the citizen record so
 * the Forum can order pieces for them; follows are ordinary subscriptions.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Wreath } from "@/components/identity/wreath";
import { TOPICS } from "@/lib/topics";
import { saveInterestsAction, toggleFollow } from "@/app/profile-actions";

type Suggestion = {
  username: string;
  displayName: string;
  bio: string | null;
  renown: number;
  pieces: number;
};

export function WelcomeFlow({
  displayName,
  initialInterests,
  suggestions,
}: {
  displayName: string;
  initialInterests: string[];
  suggestions: Suggestion[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [chosen, setChosen] = useState<Set<string>>(new Set(initialInterests));
  const [saving, startSave] = useTransition();

  function toggleTopic(key: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function goToFollow() {
    startSave(async () => {
      await saveInterestsAction([...chosen]);
      setStep(1);
    });
  }

  function enter() {
    startSave(async () => {
      // Persist once more in case they edited on the way back.
      await saveInterestsAction([...chosen]);
      toast.success(`Welcome to the city, ${displayName}.`);
      router.push("/read");
      router.refresh();
    });
  }

  return (
    <section className="mx-auto max-w-2xl px-6 pb-32 pt-12 md:pt-16">
      {/* progress rail */}
      <div className="mb-8 flex items-center gap-3">
        <StepDot active={step >= 0} done={step > 0} n={1} label="Your interests" />
        <div className={`h-px flex-1 ${step > 0 ? "bg-primary" : "bg-border"}`} />
        <StepDot active={step >= 1} done={false} n={2} label="Voices to follow" />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <p className="label-mono">Rite I · the forum is wide</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-balance text-ink">
              What do you want to read?
            </h1>
            <p className="mt-3 font-serif text-lg text-muted-foreground">
              Pick a few themes and your Forum leads with the pieces that match. You
              can change these any time in settings.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {TOPICS.map((t) => {
                const on = chosen.has(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleTopic(t.key)}
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

            <div className="mt-10 flex items-center gap-3">
              <button
                onClick={goToFollow}
                disabled={saving}
                className="rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : chosen.size > 0 ? `Continue · ${chosen.size} chosen` : "Continue"}
              </button>
              <button
                onClick={() => setStep(1)}
                className="rounded-sm px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-ink"
              >
                Skip
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="follow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <p className="label-mono">Rite II · the voices of the forum</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-balance text-ink">
              Follow a few writers
            </h1>
            <p className="mt-3 font-serif text-lg text-muted-foreground">
              Following is free - you&apos;ll see their new pieces first. Support them
              later with a read or a tip.
            </p>

            {suggestions.length === 0 ? (
              <p className="mt-8 rounded-md border border-border bg-card p-6 font-serif text-muted-foreground">
                No writers to suggest yet - you may be the first. Head to the Forum and
                start reading.
              </p>
            ) : (
              <ul className="mt-8 space-y-3">
                {suggestions.map((s) => (
                  <CreatorRow key={s.username} s={s} />
                ))}
              </ul>
            )}

            <div className="mt-10 flex items-center gap-3">
              <button
                onClick={enter}
                disabled={saving}
                className="rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Entering…" : "Enter the Forum ⊙"}
              </button>
              <button
                onClick={() => setStep(0)}
                className="rounded-sm px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-ink"
              >
                Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function StepDot({ active, done, n, label }: { active: boolean; done: boolean; n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs ${
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span className={`label-mono ${active ? "text-ink" : ""}`}>{label}</span>
    </div>
  );
}

function CreatorRow({ s }: { s: Suggestion }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [busy, startFollow] = useTransition();

  function follow() {
    startFollow(async () => {
      const res = await toggleFollow(s.username);
      if (res.ok) {
        setFollowing(!!res.following);
      } else if (res.error === "NOT_CITIZEN") {
        router.push("/citizen");
      } else {
        toast.error(res.error ?? "Could not follow.");
      }
    });
  }

  return (
    <li className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
      <Wreath renown={s.renown} size={40} variant="image" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">{s.displayName}</div>
        <div className="label-mono truncate">
          @{s.username} · {s.pieces} {s.pieces === 1 ? "piece" : "pieces"}
        </div>
        {s.bio && <p className="mt-1 line-clamp-1 font-serif text-sm text-muted-foreground">{s.bio}</p>}
      </div>
      <button
        onClick={follow}
        disabled={busy}
        className={`shrink-0 rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          following
            ? "border border-border bg-secondary text-ink hover:bg-secondary/70"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {following ? "Following ✓" : busy ? "…" : "Follow"}
      </button>
    </li>
  );
}
