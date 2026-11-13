/**
 * Server-side inquiry handling shared by /api/quote and /api/contact:
 * spam traps, rate limiting, reference numbers and Mailgun delivery.
 */
import { randomBytes } from "node:crypto";
import { getMailgunConfig } from "./config";
import { LIMITS } from "./inquiry";

// Best-effort per-IP limit (serverless instances don't share memory).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

/** Honeypot filled or form submitted faster than a person could: treat as a bot. */
export function isBot(body: Record<string, unknown>): boolean {
  const startedAt = Number(body.startedAt);
  const tooFast = !Number.isFinite(startedAt) || Date.now() - startedAt < LIMITS.minFillMs;
  return (typeof body.website === "string" && body.website !== "") || tooFast;
}

/** Inquiry reference, e.g. AS-Q-261113-7KQ2 (Q = quote, C = contact). Unambiguous characters only. */
export function newReference(kind: "Q" | "C"): string {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const code = Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("");
  return `AS-${kind}-${ymd}-${code}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "failed" carries Mailgun's HTTP status (e.g. 401 bad key, 403 domain not allowed/unverified, 404 unknown domain) for diagnosis. */
export type SendResult = { result: "sent" | "not_configured" | "failed"; status?: number };

export async function sendInquiry(opts: { subject: string; heading: string; rows: [string, string][]; replyTo: string; reference: string }): Promise<SendResult> {
  const cfg = getMailgunConfig();
  if (!cfg) {
    console.error(`[inquiry] ${opts.reference} not sent: Mailgun not configured (MAILGUN_API_KEY is missing)`);
    return { result: "not_configured" };
  }
  const text = `${opts.heading}\nReference: ${opts.reference}\n\n` + opts.rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html =
    `<p>${esc(opts.heading)}<br><strong>Reference: ${esc(opts.reference)}</strong></p><table cellspacing="0">` +
    opts.rows.map(([k, v]) => `<tr><th align="left" valign="top" style="padding:6px 14px 6px 0;color:#555">${esc(k)}</th><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join("") +
    `</table>`;
  try {
    const res = await fetch(`${cfg.apiBase}/v3/${encodeURIComponent(cfg.domain)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${cfg.apiKey}`).toString("base64")}` },
      body: new URLSearchParams({ from: cfg.from, to: cfg.to, subject: opts.subject, text, html, "h:Reply-To": opts.replyTo, "o:tag": "website-inquiry" }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[inquiry] ${opts.reference} Mailgun send failed: status=${res.status} domain=${cfg.domain} body=${detail.slice(0, 300)}`);
      return { result: "failed", status: res.status };
    }
    return { result: "sent" };
  } catch (err) {
    console.error(`[inquiry] ${opts.reference} Mailgun request error: ${(err as Error).message}`);
    return { result: "failed" };
  }
}
