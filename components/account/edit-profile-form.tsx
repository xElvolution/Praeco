/**
 * Edit profile - display name, bio, and social links.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProfile } from "@/app/profile-actions";

const FIELD =
  "w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-ink outline-none focus:border-primary";
const LABEL = "label-mono mb-1.5 block";

export function EditProfileForm({
  initial,
}: {
  initial: { displayName: string; bio: string; twitter: string; email: string; discord: string };
}) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof f, v: string) {
    setF({ ...f, [k]: v });
  }

  async function save() {
    setBusy(true);
    const res = await saveProfile(f);
    setBusy(false);
    if (res.ok) {
      toast.success("Profile saved.");
      router.refresh();
    } else toast.error(res.error ?? "save failed");
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={LABEL}>display name</label>
        <input value={f.displayName} onChange={(e) => set("displayName", e.target.value)} className={FIELD} />
      </div>
      <div>
        <label className={LABEL}>bio</label>
        <textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} rows={3} placeholder="A line about you and what you write." className={FIELD} />
      </div>

      <div className="rule pt-5">
        <p className={LABEL}>social links</p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono text-sm text-muted-foreground">𝕏 / Twitter</span>
            <input value={f.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="handle (without @)" className={`${FIELD} font-mono text-sm`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono text-sm text-muted-foreground">Email</span>
            <input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className={`${FIELD} font-mono text-sm`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono text-sm text-muted-foreground">Discord</span>
            <input value={f.discord} onChange={(e) => set("discord", e.target.value)} placeholder="username or invite" className={`${FIELD} font-mono text-sm`} />
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="rounded-sm bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
