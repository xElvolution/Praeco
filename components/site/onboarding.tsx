/**
 * First-visit onboarding - a short scroll through what Praeco is, in the
 * Roman voice. Shown once per browser, gated by localStorage. Never shown to
 * signed-in citizens or on the signup ritual. Art is the platform's own
 * painted assets so the modal reads as part of the world, not a tour widget.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PRAECO_MARK } from "@/lib/tiers";
import { LeptonCoin } from "@/components/landing/lepton-coin";

const STORAGE_KEY = "praeco-onboarded-v1";
const SUPPRESS_PATHS = ["/citizen", "/welcome", "/api", "/auth"];

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  /** wide = tablet frame, coin = mint-flip, badge = wreath */
  shape: "wide" | "coin" | "badge";
};

const SLIDES: Slide[] = [
  {
    key: "citizen",
    eyebrow: "I · citizenship",
    title: "Take your name in Rome",
    body:
      "Pick a name and Praeco forges you a Golden Relic - an ancient code, your only key. A wallet is minted for you, pre-loaded with test USDC. No card, no seed phrase, no bridge.",
    image: "/assets/tablets/tablet-relic.png",
    shape: "wide",
  },
  {
    key: "lepton",
    eyebrow: "II · reading",
    title: "Pay a lepton, read a piece",
    body:
      "Every article is sold by the read - about a cent. The toll leaves your wallet the moment you unlock, settled on Arc in under a second, and lands with the writer.",
    image: "",
    shape: "coin",
  },
  {
    key: "splits",
    eyebrow: "III · publishing",
    title: "Publish and be paid, split included",
    body:
      "Write a piece with the AI co-writer, price it per read, publish. Collaborators are paid by automatic splits on every unlock - no invoicing, no waiting.",
    image: "/assets/tablets/tablet-publish.png",
    shape: "wide",
  },
  {
    key: "arena",
    eyebrow: "IV · the arena",
    title: "Wear your laurel, climb the ranks",
    body:
      "Every read given or received earns renown. Renown raises your rank - Plebeian to Consul - and the laurel wreath beside your name grows fuller.",
    image: "/assets/wreath-consul.png",
    shape: "badge",
  },
];

function SlideArt({ slide }: { slide: Slide }) {
  if (slide.shape === "coin") {
    return <LeptonCoin size={128} />;
  }
  if (slide.shape === "badge") {
    return (
      <Image
        src={slide.image}
        alt=""
        width={128}
        height={128}
        className="h-32 w-32 object-contain drop-shadow-[0_8px_18px_rgba(120,85,25,0.35)]"
      />
    );
  }
  return (
    <Image
      src={slide.image}
      alt=""
      width={220}
      height={150}
      className="h-36 w-auto object-contain drop-shadow-[0_10px_22px_rgba(60,42,15,0.4)]"
    />
  );
}

export function Onboarding() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (SUPPRESS_PATHS.some((p) => pathname?.startsWith(p))) return;

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    const ctrl = new AbortController();
    fetch("/api/me", { cache: "no-store", signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!d.citizen) setOpen(true);
      })
      .catch(() => {
        /* if we can't tell, stay quiet rather than pop over a broken page */
      });
    return () => ctrl.abort();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        markSeen();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  function dismiss() {
    markSeen();
    setOpen(false);
  }

  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="praeco-onboarding-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="parchment-grain relative w-full max-w-lg overflow-hidden rounded-t-md border border-border bg-parchment shadow-2xl sm:rounded-md"
          >
            {/* header rail */}
            <div className="flex items-center justify-between border-b border-border bg-card/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <Image src={PRAECO_MARK} alt="" width={22} height={22} className="rounded-full" />
                <span className="font-display text-sm font-semibold text-ink">Praeco</span>
                <span className="label-mono hidden sm:inline">⊙ the crier</span>
              </div>
              <button
                onClick={dismiss}
                className="label-mono rounded-sm px-2 py-1 transition-colors hover:text-ink"
                aria-label="Skip introduction"
              >
                skip
              </button>
            </div>

            {/* slide */}
            <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mx-auto flex h-40 items-center justify-center">
                    <SlideArt slide={slide} />
                  </div>
                  <p className="label-mono mt-5 text-center">{slide.eyebrow}</p>
                  <h2
                    id="praeco-onboarding-title"
                    className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-balance text-ink"
                  >
                    {slide.title}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-center font-serif text-base leading-relaxed text-muted-foreground">
                    {slide.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* pagination */}
              <div className="mt-8 flex items-center justify-center gap-1.5">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>

              {/* actions */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="rounded-sm border border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>

                {last ? (
                  <Link
                    href="/citizen"
                    onClick={dismiss}
                    className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Become a citizen →
                  </Link>
                ) : (
                  <button
                    onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
                    className="flex-1 rounded-sm bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
