/**
 * Become a Citizen - the onboarding ritual. Forge a relic (carved in stone),
 * save it, enter. Or log in with username + relic.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Nav } from "@/components/site/nav";
import { StoneTablet } from "@/components/citizen/stone-tablet";
import { doSignup, doLogin } from "@/app/auth-actions";

const FIELD =
  "w-full rounded-sm border border-border bg-card px-3 py-2.5 font-serif text-ink shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary";

export default function CitizenPage() {
  return (
    <Suspense fallback={null}>
      <CitizenInner />
    </Suspense>
  );
}

function CitizenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [username, setUsername] = useState("");
  const [display, setDisplay] = useState("");
  const [relic, setRelic] = useState("");
  const [busy, setBusy] = useState(false);
  const [forged, setForged] = useState<{ relic: string; username: string; wallet: string } | null>(null);
  const [saved, setSaved] = useState(false);

  async function signup() {
    setBusy(true);
    const res = await doSignup(username, display, ref);
    setBusy(false);
    if (res.ok) setForged({ relic: res.relic, username: res.username, wallet: res.wallet });
    else toast.error(res.error);
  }

  async function login() {
    setBusy(true);
    const res = await doLogin(username, relic);
    setBusy(false);
    if (res.ok) {
      toast.success(`Welcome back, ${res.username}.`);
      router.push("/me");
      router.refresh();
    } else toast.error(res.error);
  }

  // --- The forged relic reveal ---
  if (forged) {
    return (
      <div className="min-h-screen">
        <Nav />
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="label-mono">
            citizen {forged.username} · forged
          </motion.p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Guard your relic</h1>

          <div className="mt-8">
            <StoneTablet relic={forged.relic} />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forged.relic.split("·").length * 0.45 + 1.4 }}
          >
            <p className="mx-auto mt-6 max-w-sm font-serif text-muted-foreground">
              This is the only key to your vault. The ancients sealed their wills
              in tablets. Store yours somewhere safe. Lose it and the vault is
              sealed forever.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(forged.relic);
                  setSaved(true);
                  toast.success("Relic copied. Keep it safe.");
                }}
                className="rounded-sm border border-border px-5 py-2.5 font-mono text-sm hover:bg-secondary"
              >
                {saved ? "✓ copied" : "Copy the relic"}
              </button>
              <button
                onClick={() => {
                  router.push("/welcome");
                  router.refresh();
                }}
                disabled={!saved}
                className="rounded-sm bg-primary px-7 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                I have stored it. Enter Praeco ⊙
              </button>
              {!saved && <p className="text-xs text-muted-foreground">Copy your relic to continue.</p>}
            </div>
          </motion.div>
        </section>
      </div>
    );
  }

  // --- Signup / login form ---
  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-md px-6 py-16">
        <p className="label-mono">{mode === "signup" ? "Become a Citizen" : "Return to the Forum"}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          {mode === "signup" ? "Take your place in the city" : "Welcome back"}
        </h1>
        <p className="mt-3 font-serif text-muted-foreground">
          {mode === "signup"
            ? "Choose a name. We forge you a golden relic, your one key, and a wallet that pays and earns."
            : "Enter your name and relic to unseal your vault."}
        </p>
        {mode === "signup" && ref && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-xs text-primary">
            ⊙ joining on @{ref}&apos;s invitation
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 space-y-4"
          >
            <div>
              <label className="label-mono mb-1.5 block">username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="wandering-rhapsode"
                className={`${FIELD} font-mono`}
              />
            </div>

            {mode === "signup" ? (
              <div>
                <label className="label-mono mb-1.5 block">display name (optional)</label>
                <input value={display} onChange={(e) => setDisplay(e.target.value)} placeholder="The Rhapsode" className={FIELD} />
              </div>
            ) : (
              <div>
                <label className="label-mono mb-1.5 block">golden relic</label>
                <input
                  value={relic}
                  onChange={(e) => setRelic(e.target.value)}
                  placeholder="AQVILA·ΛΕΠΤΟΝ·CORVVS·XLVII·ΔΕΛΤΑ·IGNIS"
                  className={`${FIELD} font-mono text-sm`}
                />
              </div>
            )}

            <button
              onClick={mode === "signup" ? signup : login}
              disabled={busy || username.length < 3 || (mode === "login" && relic.length < 4)}
              className="w-full rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy
                ? mode === "signup"
                  ? "Forging your relic…"
                  : "Unsealing…"
                : mode === "signup"
                  ? "Forge my relic ⊙"
                  : "Enter ⊙"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already a citizen? " : "New here? "}
              <button
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                className="text-primary underline"
              >
                {mode === "signup" ? "Log in with your relic" : "Become a citizen"}
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
