/**
 * Server-side inquiry handling shared by /api/quote and /api/contact:
 * spam traps, rate limiting, reference numbers and Mailgun delivery.
 */
import { randomBytes } from "node:crypto";
import { getMailgunConfig, mailgunConfigMissing } from "./config";
import { strictReplyTo } from "./replyTo";
import { verifyToken, type FormName } from "./formToken";

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

/**
 * Server-side spam checks (finding F-005).
 * - "bot": honeypot filled, forged/malformed token, too fast, or another form's token. Answered exactly
 *   like a success so bots learn nothing.
 * - "retry": token missing, expired (page open > 2h) or signed with a previous key. Answered with a
 *   retryable 409 "token_expired" so a real visitor's form fetches a fresh token and resubmits;
 *   a genuine inquiry is never silently dropped.
 */
export function spamCheck(body: Record<string, unknown>, form: FormName): "ok" | "bot" | "retry" | "not_configured" {
  const honeypotFilled = typeof body.website === "string" && body.website !== "";
  const token = verifyToken(body.token, form);
  if (!token.ok && token.reason === "no_key") return "not_configured";
  if (honeypotFilled) return refuse(form, "honeypot", "bot");
  if (token.ok) return "ok";
  return ["missing", "expired", "stale_key"].includes(token.reason) ? refuse(form, token.reason, "retry") : refuse(form, token.reason, "bot");
}

function refuse<T extends "bot" | "retry">(form: FormName, reason: string, result: T): T {
  console.warn(`[inquiry] ${form} submission ${result === "bot" ? "refused as spam" : "asked to retry"}: ${reason}`);
  return result;
}

/** Client IP on Vercel: x-real-ip, else the first x-forwarded-for entry, else "unknown". */
export function clientIp(request: Request): string {
  return request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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

/** Mailgun's HTTP status on failure, for server-side diagnosis only (also written to the server log). Never sent to the browser. */
export type SendResult = { result: "sent" | "not_configured" | "failed"; status?: number };

/** Fixed subject (no visitor text). Reply-To only for a strictly valid single address. */
function mailForm(cfg: { from: string; to: string }, opts: { subject: string; replyTo: string }, text: string, html: string) {
  const form = new URLSearchParams({ from: cfg.from, to: cfg.to, subject: opts.subject, text, html, "o:tag": "website-inquiry" });
  const replyTo = strictReplyTo(opts.replyTo);
  if (replyTo) form.set("h:Reply-To", replyTo);
  return form;
}

export async function sendInquiry(opts: { subject: string; heading: string; rows: [string, string][]; replyTo: string; reference: string }): Promise<SendResult> {
  const cfg = getMailgunConfig();
  if (!cfg) {
    console.error(`[inquiry] ${opts.reference} not sent: mail not configured (missing: ${mailgunConfigMissing().join(", ")})`);
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
      body: mailForm(cfg, opts, text, html),
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
