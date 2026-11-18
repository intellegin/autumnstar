/**
 * Server-checked form time token (security finding F-005).
 *
 * Token = "<form>.<issuedAtMs>.<random>.<hmac>", HMAC-SHA256 over the first three parts.
 * The HMAC key is derived from the existing MAILGUN_API_KEY with HKDF (fixed label
 * "as-form-token-v1"), so no extra secret is needed. Without MAILGUN_API_KEY no token
 * can be issued or verified, and the forms report "not configured" (mail can't be sent anyway).
 *
 * A submission is accepted only if the token is genuine, for the same form, at least
 * MIN_FILL_MS old (too-fast bots) and at most MAX_AGE_MS old (stale/replayed pages).
 */
import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { LIMITS } from "./inquiry";

export const FORMS = ["quote", "contact"] as const;
export type FormName = (typeof FORMS)[number];
export const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

let cachedKey: { source: string; key: Buffer } | null = null;

function key(): Buffer | null {
  const ikm = process.env.MAILGUN_API_KEY?.trim();
  if (!ikm) return null;
  if (cachedKey?.source !== ikm) {
    cachedKey = { source: ikm, key: Buffer.from(hkdfSync("sha256", ikm, "autumnstar.ca", "as-form-token-v1", 32)) };
  }
  return cachedKey.key;
}

const sign = (k: Buffer, payload: string) => createHmac("sha256", k).update(payload).digest("base64url");

export function issueToken(form: FormName, now = Date.now()): string | null {
  const k = key();
  if (!k) return null;
  const payload = `${form}.${now}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(k, payload)}`;
}

export type TokenCheck =
  | { ok: true }
  | { ok: false; reason: "no_key" | "missing" | "malformed" | "bad_signature" | "wrong_form" | "too_fast" | "expired" };

export function verifyToken(token: unknown, form: FormName, now = Date.now()): TokenCheck {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  if (typeof token !== "string" || !token) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 4 || token.length > 200) return { ok: false, reason: "malformed" };
  const [f, ts, rnd, sig] = parts;
  const expected = Buffer.from(sign(k, `${f}.${ts}.${rnd}`));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "bad_signature" };
  if (f !== form) return { ok: false, reason: "wrong_form" };
  const age = now - Number(ts);
  if (!Number.isFinite(age) || age < LIMITS.minFillMs) return { ok: false, reason: "too_fast" };
  if (age > MAX_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}
