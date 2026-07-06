/**
 * Citizenship - accounts, relic-based keys, and session.
 *
 * Signup forges a Golden Relic, mints + funds a wallet, encrypts the private key
 * under the relic, and stores only ciphertext. Login decrypts with the relic.
 * The session cookie carries the decrypted key inside a server-secret envelope,
 * so a citizen can spend during the session without re-entering the relic.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import { cookies } from "next/headers";
import type { Hex } from "viem";
import { provisionReaderWallet } from "./treasury";
import { forgeRelic, normalizeRelic } from "./relic";
import { sealWithSecret, openWithSecret, sessionSecret } from "./crypto";
import { createUser, getUserByUsername, getUserById, setReferredBy, type User } from "./data";

const SESSION_COOKIE = "praeco_cit";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function cleanUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
}

async function setSession(userId: string, privKey: string) {
  const jar = await cookies();
  const envelope = sealWithSecret(JSON.stringify({ userId, privKey }), sessionSecret());
  jar.set(SESSION_COOKIE, envelope, COOKIE_OPTS);
}

export type SignupResult =
  | { ok: true; username: string; relic: string; wallet: string }
  | { ok: false; error: string };

export async function signupCitizen(
  usernameRaw: string,
  displayNameRaw?: string,
  refUsername?: string,
): Promise<SignupResult> {
  const username = cleanUsername(usernameRaw);
  if (username.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
  if (await getUserByUsername(username)) return { ok: false, error: "That name is already taken." };

  const relic = forgeRelic();
  const wallet = await provisionReaderWallet();
  const encPriv = sealWithSecret(wallet.privateKey, relic);

  const user = await createUser({
    username,
    displayName: displayNameRaw?.trim() || username,
    wallet: wallet.address,
    encPriv,
  });

  // Clientela: bind the patron who referred this citizen, if any (never self).
  const ref = refUsername ? cleanUsername(refUsername) : "";
  if (ref && ref !== username) {
    const patron = await getUserByUsername(ref);
    if (patron) await setReferredBy(user.id, patron.id);
  }

  await setSession(user.id, wallet.privateKey);
  return { ok: true, username, relic, wallet: wallet.address };
}

export type LoginResult = { ok: true; username: string } | { ok: false; error: string };

export async function loginCitizen(usernameRaw: string, relicRaw: string): Promise<LoginResult> {
  const username = cleanUsername(usernameRaw);
  const user = await getUserByUsername(username);
  if (!user) return { ok: false, error: "No citizen by that name." };
  try {
    const privKey = openWithSecret(user.enc_priv, normalizeRelic(relicRaw));
    await setSession(user.id, privKey);
    return { ok: true, username };
  } catch {
    return { ok: false, error: "That relic does not open this vault." };
  }
}

export async function logoutCitizen() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The signed-in citizen + their in-session private key, or null. */
export async function currentCitizen(): Promise<{ user: User; privKey: Hex } | null> {
  const jar = await cookies();
  const envelope = jar.get(SESSION_COOKIE)?.value;
  if (!envelope) return null;
  try {
    const { userId, privKey } = JSON.parse(openWithSecret(envelope, sessionSecret()));
    const user = await getUserById(userId);
    if (!user) return null;
    return { user, privKey: privKey as Hex };
  } catch {
    return null;
  }
}

/** Just the user record (no key), for read-only UI. */
export async function currentUser(): Promise<User | null> {
  return (await currentCitizen())?.user ?? null;
}
