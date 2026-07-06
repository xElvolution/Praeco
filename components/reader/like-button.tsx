/**
 * Like / unlike a piece.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toggleLike } from "@/app/profile-actions";

export function LikeButton({
  articleId,
  initialLiked,
  initialCount,
}: {
  articleId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  async function go() {
    const optimistic = !liked;
    setLiked(optimistic);
    setCount((c) => c + (optimistic ? 1 : -1));
    const res = await toggleLike(articleId);
    if (!res.ok) {
      setLiked(!optimistic);
      setCount((c) => c + (optimistic ? -1 : 1));
      if (res.error === "NOT_CITIZEN") router.push("/citizen");
    } else {
      setLiked(!!res.liked);
      if (typeof res.count === "number") setCount(res.count);
      // Invalidate the router cache so the like survives navigating away and back.
      router.refresh();
    }
  }

  return (
    <button onClick={go} className="flex items-center gap-1.5 text-sm" title="like">
      <motion.span whileTap={{ scale: 1.4 }} className={liked ? "text-destructive" : "text-muted-foreground"}>
        {liked ? "♥" : "♡"}
      </motion.span>
      <span className="font-mono text-xs text-muted-foreground">{count}</span>
    </button>
  );
}
