/**
 * Encryption for citizen keys.
 *
 * A citizen's wallet private key is never stored in the clear. It is encrypted
 * with a key derived (scrypt) from their Golden Relic. The database holds only
 * ciphertext - without the relic, the vault is sealed. Session continuity uses a
 * separate server-secret envelope so a citizen can spend without re-entering the
 * relic each time.
 *
 * Testnet note: the relic carries ~50-60 bits of entropy for memorability;
 * scrypt makes brute force expensive. A production build would use a
 * BIP39-grade wordlist for 128-bit relics.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import "server-only";
import {
  scryptSync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

const SCRYPT_N = 1 << 15; // 32768
const KEYLEN = 32;

function deriveKey(secret: string, salt: Buffer): Buffer {
  // maxmem must exceed ~128*N*r bytes; default 32MB is too low for N=2^15.
  return scryptSync(secret.normalize("NFKC"), salt, KEYLEN, {
    N: SCRYPT_N,
    r: 8,
    p: 1,
    maxmem: 96 * 1024 * 1024,
  });
}

/** Encrypt plaintext with a secret + fresh salt. Returns a portable string. */
export function sealWithSecret(plaintext: string, secret: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(secret, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${salt.toString("base64")}:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

/** Decrypt. Throws if the secret is wrong (auth tag mismatch). */
export function openWithSecret(payload: string, secret: string): string {
  const [v, saltB, ivB, tagB, ctB] = payload.split(":");
  if (v !== "v1") throw new Error("bad ciphertext");
  const salt = Buffer.from(saltB, "base64");
  const iv = Buffer.from(ivB, "base64");
  const tag = Buffer.from(tagB, "base64");
  const ct = Buffer.from(ctB, "base64");
  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Server-side session secret (envelopes the in-session private key). */
export function sessionSecret(): string {
  const s = process.env.PRAECO_SESSION_SECRET;
  if (!s) throw new Error("Missing PRAECO_SESSION_SECRET");
  return s;
}
