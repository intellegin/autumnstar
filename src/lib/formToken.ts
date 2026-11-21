/**
 * Server-checked form time token (security finding F-005).
 *
 * Token = "<form>.<issuedAt>.<startedAt>.<random>.<kid>.<hmac>" (HMAC-SHA256 over the first five parts).
 * - issuedAt: when this token was minted; tokens older than MAX_AGE_MS are "expired".
 * - startedAt: when the visitor's page first got a token. A refreshed token keeps the ORIGINAL start
 *   time (via `prev`), so a refresh + retry is never mistaken for a too-fast bot.
 * - kid: a short, non-secret fingerprint of the signing key. A token from a previous key
 *   (MAILGUN_API_KEY rotated) is reported as stale, i.e. retryable, instead of forged.
 * The key is derived from the existing MAILGUN_API_KEY with HKDF (label "as-form-token-v1"), so no extra
 * secret is needed. Without MAILGUN_API_KEY no token can be issued and the forms report "not configured".
 */
import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { LIMITS } from "./inquiry";

export const FORMS = ["quote", "contact"] as const;
export type FormName = (typeof FORMS)[number];
export const MAX_AGE_MS = 2 * 60 * 60 * 1000; // a token is valid for 2 hours after it is issued
const MAX_CARRY_MS = 24 * 60 * 60 * 1000;      // a start time older than this is not carried over

let cached: { source: string; key: Buffer; kid: string } | null = null;

function signingKey() {
  const ikm = process.env.MAILGUN_API_KEY?.trim();
  if (!ikm) return null;
  if (cached?.source !== ikm) {
    const key = Buffer.from(hkdfSync("sha256", ikm, "autumnstar.ca", "as-form-token-v1", 32));
    cached = { source: ikm, key, kid: createHmac("sha256", key).update("kid").digest("base64url").slice(0, 8) };
  }
  return cached;
}

const sign = (key: Buffer, payload: string) => createHmac("sha256", key).update(payload).digest("base64url");

type Parsed = { form: string; iat: number; start: number; rnd: string; kid: string; sig: string; payload: string };

function parse(token: unknown): Parsed | null {
  if (typeof token !== "string" || token.length > 220) return null;
  const p = token.split(".");
  if (p.length !== 6) return null;
  const [form, iat, start, rnd, kid, sig] = p;
  return { form, iat: Number(iat), start: Number(start), rnd, kid, sig, payload: p.slice(0, 5).join(".") };
}

function genuine(t: Parsed, k: { key: Buffer; kid: string }) {
  if (t.kid !== k.kid) return false;
  const expected = Buffer.from(sign(k.key, t.payload));
  const given = Buffer.from(t.sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Mint a token. If `prev` is a genuine token for the same form (current key), its start time is kept.
 * Returns the token and how long the client should wait before submitting (minimum fill time).
 */
export function issueToken(form: FormName, prev?: string | null, now = Date.now()) {
  const k = signingKey();
  if (!k) return null;
  const p = parse(prev);
  const start = p && p.form === form && genuine(p, k) && now - p.start < MAX_CARRY_MS && p.start <= now ? p.start : now;
  const payload = `${form}.${now}.${start}.${randomBytes(9).toString("base64url")}.${k.kid}`;
  return { token: `${payload}.${sign(k.key, payload)}`, minWaitMs: Math.max(0, start + LIMITS.minFillMs - now) };
}

export type TokenCheck =
  | { ok: true }
  | { ok: false; reason: "no_key" | "missing" | "malformed" | "stale_key" | "bad_signature" | "wrong_form" | "too_fast" | "expired" };

export function verifyToken(token: unknown, form: FormName, now = Date.now()): TokenCheck {
  const k = signingKey();
  if (!k) return { ok: false, reason: "no_key" };
  if (token == null || token === "") return { ok: false, reason: "missing" };
  const t = parse(token);
  if (!t || !Number.isFinite(t.iat) || !Number.isFinite(t.start)) return { ok: false, reason: "malformed" };
  if (t.kid !== k.kid) return { ok: false, reason: "stale_key" };          // signed with a previous key
  if (!genuine(t, k)) return { ok: false, reason: "bad_signature" };
  if (t.form !== form) return { ok: false, reason: "wrong_form" };
  if (now - t.start < LIMITS.minFillMs) return { ok: false, reason: "too_fast" };
  if (now - t.iat > MAX_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}
