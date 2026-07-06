/**
 * Follow / unfollow a creator (free - get notified of new pieces).
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleFollow } from "@/app/profile-actions";

export function FollowButton({
  username,
  initialFollowing,
  initialCount,
}: {
  username: string;
  initialFollowing: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const res = await toggleFollow(username);
    setBusy(false);
    if (res.ok) {
      setFollowing(!!res.following);
      setCount((c) => c + (res.following ? 1 : -1));
      // Re-render the server component so the profile's FOLLOWERS stat (and any
      // other follower-derived counts) reflect the change without a reload.
      router.refresh();
    } else if (res.error === "NOT_CITIZEN") {
      router.push("/citizen");
    } else toast.error(res.error ?? "failed");
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        following
          ? "border border-border bg-secondary text-ink hover:bg-secondary/70"
          : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {following ? "Following" : "Subscribe"} · {count}
    </button>
  );
}
