/**
 * Profile, follow, and like actions for the signed-in citizen.
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { currentCitizen } from "@/lib/auth";
import {
  updateProfile,
  getUserByUsername,
  followCreator,
  unfollowCreator,
  isFollowing,
  likeArticle,
  unlikeArticle,
  likeState,
  saveInterests,
} from "@/lib/data";
import { cleanTopics } from "@/lib/topics";

export async function saveProfile(p: {
  displayName: string;
  bio: string;
  twitter: string;
  email: string;
  discord: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  if (!p.displayName.trim()) return { ok: false, error: "Display name can't be empty." };
  await updateProfile(cit.user.id, {
    displayName: p.displayName.trim(),
    bio: p.bio.trim(),
    twitter: p.twitter.trim().replace(/^@/, ""),
    email: p.email.trim(),
    discord: p.discord.trim(),
  });
  return { ok: true };
}

export async function saveInterestsAction(interests: string[]): Promise<{ ok: boolean; error?: string }> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  await saveInterests(cit.user.id, cleanTopics(interests));
  return { ok: true };
}

export async function toggleFollow(creatorUsername: string): Promise<{ ok: boolean; following?: boolean; error?: string }> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  const creator = await getUserByUsername(creatorUsername);
  if (!creator) return { ok: false, error: "No such creator." };
  const already = await isFollowing(cit.user.id, creator.id);
  if (already) await unfollowCreator(cit.user.id, creator.id);
  else await followCreator(cit.user.id, creator.id);
  return { ok: true, following: !already };
}

export async function toggleLike(articleId: string): Promise<{ ok: boolean; liked?: boolean; count?: number; error?: string }> {
  const cit = await currentCitizen();
  if (!cit) return { ok: false, error: "NOT_CITIZEN" };
  const { liked } = await likeState(cit.user.id, articleId);
  if (liked) await unlikeArticle(cit.user.id, articleId);
  else await likeArticle(cit.user.id, articleId);
  const next = await likeState(cit.user.id, articleId);
  return { ok: true, liked: next.liked, count: next.count };
}
