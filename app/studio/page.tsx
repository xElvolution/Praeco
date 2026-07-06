/**
 * The Studio - a focused writing desk. Compose in Markdown in the main column;
 * the co-writer rides along in a sidebar on the right (chat + one-click tools).
 * Images drop, paste, or upload inline. A Write/Preview toggle shows the
 * reader's view without leaving the page.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Nav } from "@/components/site/nav";
import { Markdown } from "@/components/reader/markdown";
import { StudioChat, type ToolMode } from "@/components/studio/studio-chat";
import { publishArticle } from "@/app/creator-actions";
import { TOPICS } from "@/lib/topics";
import { FREE_DAILY_AI } from "@/lib/pro";

const TOOL_BTN =
  "flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background/60 px-2 font-mono text-xs text-ink transition-colors hover:border-primary/50 hover:bg-secondary disabled:opacity-40";

/** Downscale an image file to a reasonable width and return a data URL. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 1400;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

export default function Studio() {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [citizen, setCitizen] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("0.01");
  const [collabs, setCollabs] = useState<{ handle: string; wallet: string; share: string }[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [pro, setPro] = useState(false);
  const [aiLeft, setAiLeft] = useState(FREE_DAILY_AI);
  const [aiLimit, setAiLimit] = useState(FREE_DAILY_AI);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [selection, setSelection] = useState("");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCitizen(!!d.citizen);
        setPro(!!d.citizen?.pro);
        setAiLeft(d.citizen?.aiRemaining ?? FREE_DAILY_AI);
        setAiLimit(d.citizen?.aiLimit ?? FREE_DAILY_AI);
      });
  }, []);

  const exhausted = aiLeft <= 0;

  function captureSelection() {
    const ta = bodyRef.current;
    if (!ta) return;
    setSelection(body.slice(ta.selectionStart, ta.selectionEnd));
  }

  // --- Markdown editing helpers ---
  function surround(before: string, after = before, placeholder = "text") {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + before + sel + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const s = start + before.length;
      ta.setSelectionRange(s, s + sel.length);
    });
  }
  function prefixLine(prefix: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = body.lastIndexOf("\n", start - 1) + 1;
    const next = body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const p = start + prefix.length;
      ta.setSelectionRange(p, p);
    });
  }
  function insertText(snippet: string) {
    const ta = bodyRef.current;
    if (!ta) {
      setBody((b) => (b ? `${b}\n\n${snippet}` : snippet));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = body.slice(0, start) + snippet + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function addImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const t = toast.loading("Adding image…");
    try {
      const url = await fileToDataUrl(file);
      insertText(`\n\n![](${url})\n\n`);
      toast.success("Image added.", { id: t });
    } catch {
      toast.error("Could not add that image.", { id: t });
    }
  }
  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) addImageFile(f);
    e.target.value = "";
  }
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const f = item.getAsFile();
      if (f) {
        e.preventDefault();
        addImageFile(f);
      }
    }
  }
  function onDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith("image/"));
    if (f) {
      e.preventDefault();
      addImageFile(f);
    }
  }

  /** One-click AI tools (from the sidebar Tools tab). */
  async function tool(m: ToolMode) {
    const seed = m === "draft" ? title : body || title;
    const base = seed.trim();
    if (base.length < 3) {
      toast.error(m === "draft" ? "Give it a title first." : "Write a little first.");
      return;
    }
    if (exhausted) {
      toast.error(pro ? "No assists left today." : "Out of free assists. Go Pro for more.");
      return;
    }
    setBusy(m);
    try {
      const textForAi = base.replace(/!\[([^\]]*)\]\(data:[^)]*\)/g, "![$1](image)");
      const res = await fetch("/api/studio/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m, text: textForAi, title }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "LIMIT_REACHED") {
          setAiLeft(0);
          toast.error(data.message || "You've used today's assists.");
          return;
        }
        throw new Error(data.error);
      }
      if (typeof data.remaining === "number") setAiLeft(data.remaining);
      if (m === "improve" || m === "draft") {
        setBody(data.result);
        if (m === "draft") toast.success("Draft written - edit it to make it yours.");
      }
      if (m === "preview") setPreview(data.result);
      if (m === "title") setTitleIdeas(data.titles ?? []);
      if (m === "price") {
        setPrice(data.price);
        toast.success(`Suggested $${data.price}: ${data.why}`);
      }
    } catch (e) {
      toast.error((e as Error).message?.slice(0, 140) ?? "assist failed");
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    setPending(true);
    const res = await publishArticle({
      title,
      preview,
      body,
      price,
      topics,
      collaborators: collabs.filter((c) => c.handle && c.wallet),
    });
    setPending(false);
    if (res.ok) {
      setPublished(res.slug);
      toast.success("Published. Your piece is live and earning.");
    } else if (res.error === "NOT_CITIZEN") {
      router.push("/citizen");
    } else toast.error(res.error);
  }

  if (citizen === false) {
    return (
      <div className="min-h-screen">
        <Nav />
        <section className="mx-auto max-w-md px-6 py-24 text-center">
          <p className="text-3xl">⊙</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Citizens publish here</h1>
          <p className="mt-3 font-serif text-muted-foreground">Become a citizen to publish a piece and get paid per read.</p>
          <Link href="/citizen" className="mt-6 inline-block rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">
            Become a citizen
          </Link>
        </section>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen">
        <Nav />
        <section className="mx-auto max-w-xl px-6 py-24 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="text-4xl">⊙</p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-ink">Your piece is live.</h1>
            <p className="mt-3 font-serif text-muted-foreground">Every read now pays your wallet, settled on Arc. Share the link.</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link href={`/a/${published}`} className="rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">
                View your piece →
              </Link>
              <button
                onClick={() => { setPublished(null); setTitle(""); setBody(""); setPreview(""); setCollabs([]); setTopics([]); setTitleIdeas([]); }}
                className="label-mono hover:text-ink"
              >
                publish another
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    );
  }

  const canPublish = !!title.trim() && !!body.trim() && !pending;

  return (
    <div className="min-h-screen">
      <Nav />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />

      {/* Main column - leaves room for the fixed co-writer sidebar on lg+. */}
      <section className="mx-auto max-w-3xl px-6 pb-40 pt-10 md:pb-28 lg:mr-[392px]">
        {/* Header */}
        <div>
          <p className="label-mono">The Studio</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">Compose a piece</h1>
        </div>

        {/* Editor card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
          <div className="p-6 md:p-8">
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full border-0 bg-transparent font-display text-4xl font-semibold leading-tight tracking-tight text-ink outline-none placeholder:text-muted-foreground/40"
              />
              <button onClick={() => tool("title")} disabled={busy !== null || exhausted} className={`${TOOL_BTN} mt-2 shrink-0 px-2.5`} title="Suggest titles">
                {busy === "title" ? "…" : "ideas"}
              </button>
            </div>
            {titleIdeas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {titleIdeas.map((t) => (
                  <button key={t} onClick={() => { setTitle(t); setTitleIdeas([]); }} className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-ink transition-colors hover:border-primary/50">
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Teaser */}
            <input
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              placeholder="A one-line teaser readers see before they pay…"
              className="mt-4 w-full border-0 border-t border-border bg-transparent pt-4 font-serif text-lg text-muted-foreground outline-none placeholder:text-muted-foreground/40"
            />

            {/* Toolbar + Write/Preview toggle */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div className={`flex flex-wrap items-center gap-1.5 ${mode === "preview" ? "pointer-events-none opacity-40" : ""}`}>
                <button onClick={() => prefixLine("## ")} className={TOOL_BTN} title="Heading">H2</button>
                <button onClick={() => surround("**")} className={`${TOOL_BTN} font-bold`} title="Bold">B</button>
                <button onClick={() => surround("_")} className={`${TOOL_BTN} italic`} title="Italic">I</button>
                <button onClick={() => prefixLine("> ")} className={TOOL_BTN} title="Quote">❝</button>
                <button onClick={() => prefixLine("- ")} className={TOOL_BTN} title="List">•</button>
                <button onClick={() => surround("[", "](https://)", "link")} className={TOOL_BTN} title="Link">↗</button>
                <span className="mx-1 h-5 w-px bg-border" />
                <button onClick={() => fileRef.current?.click()} className={`${TOOL_BTN} gap-1.5 px-2.5`} title="Insert image">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>
                  image
                </button>
              </div>
              <div className="flex gap-1 rounded-md border border-border bg-secondary/30 p-0.5">
                {(["write", "preview"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-sm px-3 py-1 text-xs capitalize transition-colors ${mode === m ? "bg-card font-medium text-ink shadow-sm" : "text-muted-foreground hover:text-ink"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Body - write or preview */}
            {mode === "write" ? (
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onSelect={captureSelection}
                onKeyUp={captureSelection}
                onMouseUp={captureSelection}
                onPaste={onPaste}
                onDrop={onDrop}
                rows={22}
                placeholder="Write in Markdown - or ask the co-writer on the right to draft from your title. Drop or paste an image anywhere."
                className="mt-4 min-h-[480px] w-full resize-y border-0 bg-transparent font-serif text-lg leading-relaxed text-ink outline-none placeholder:text-muted-foreground/40"
              />
            ) : (
              <div className="mt-4 min-h-[480px]">
                {body.trim() ? (
                  <Markdown>{body}</Markdown>
                ) : (
                  <p className="font-serif text-lg text-muted-foreground/40">Nothing to preview yet - switch to Write and begin.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="label-mono mb-1.5 block">price / read</label>
              <button onClick={() => tool("price")} disabled={busy !== null || exhausted} className={`${TOOL_BTN} px-2.5`}>{busy === "price" ? "…" : "suggest"}</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">$</span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-28 rounded-md border border-input bg-background px-3 py-2 font-mono text-ink outline-none focus:border-primary" />
              <span className="label-mono">USDC · about a cent is typical</span>
            </div>
          </div>

          <div>
            <label className="label-mono mb-1.5 block">topics</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => {
                const on = topics.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTopics((prev) => (on ? prev.filter((k) => k !== t.key) : [...prev, t.key]))}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-ink hover:border-primary/50 hover:bg-secondary/60"}`}
                  >
                    {on && <span className="mr-1">✓</span>}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="label-mono mb-1.5 block">collaborators - each read splits automatically</label>
              <button type="button" onClick={() => setCollabs([...collabs, { handle: "", wallet: "", share: "" }])} className="label-mono hover:text-ink">+ add</button>
            </div>
            {collabs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Add a co-author or editor and each read splits by share. You keep the rest.</p>
            ) : (
              <div className="space-y-2">
                {collabs.map((c, i) => (
                  <div key={i} className="flex flex-wrap gap-2">
                    <input placeholder="handle" value={c.handle} onChange={(e) => { const n = [...collabs]; n[i] = { ...c, handle: e.target.value }; setCollabs(n); }} className="w-28 rounded-md border border-input bg-background px-3 py-2 font-serif text-sm text-ink outline-none focus:border-primary" />
                    <input placeholder="0x wallet" value={c.wallet} onChange={(e) => { const n = [...collabs]; n[i] = { ...c, wallet: e.target.value }; setCollabs(n); }} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-ink outline-none focus:border-primary" />
                    <input placeholder="%" value={c.share} onChange={(e) => { const n = [...collabs]; n[i] = { ...c, share: e.target.value }; setCollabs(n); }} className="w-16 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-ink outline-none focus:border-primary" />
                    <button type="button" onClick={() => setCollabs(collabs.filter((_, j) => j !== i))} className="px-2 text-muted-foreground hover:text-destructive">×</button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">You keep {Math.max(0, 100 - collabs.reduce((s, c) => s + (Number(c.share) || 0), 0))}% of every read.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile co-writer note - the sidebar is lg+ only. */}
        <p className="mt-6 text-center label-mono lg:hidden">The AI co-writer opens on a wider screen.</p>
      </section>

      {/* Sticky action bar - Preview + Publish. Sits above the mobile dock. */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-parchment/90 backdrop-blur-sm md:bottom-0 lg:right-[392px]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-3">
          <span className="label-mono hidden sm:block">
            {title.trim() && body.trim() ? "ready to publish" : "add a title and body to publish"}
          </span>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <button
              onClick={() => setMode((m) => (m === "write" ? "preview" : "write"))}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-secondary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
              </svg>
              {mode === "preview" ? "Keep writing" : "Preview"}
            </button>
            <button
              onClick={submit}
              disabled={!canPublish}
              className="rounded-md bg-primary px-7 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Publishing…" : "Publish ⊙"}
            </button>
          </div>
        </div>
      </div>

      {/* Co-writer sidebar - right side, lg+ */}
      <StudioChat
        title={title}
        body={body}
        selection={selection}
        pro={pro}
        aiLeft={aiLeft}
        aiLimit={aiLimit}
        onInsert={insertText}
        onTool={tool}
        toolBusy={busy}
        onExhausted={() => setAiLeft(0)}
        onSpend={setAiLeft}
      />
    </div>
  );
}
