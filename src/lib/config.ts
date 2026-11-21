/**
 * Central server-side configuration: the only place environment variables are read.
 * Email is sent only through Mailgun (owner rule: no unapproved third-party services).
 */
export type MailgunConfig = { apiKey: string; domain: string; apiBase: string; from: string; to: string };

/**
 * Sending only: the app calls Mailgun's POST /v3/<domain>/messages and nothing else, so a
 * domain-scoped sending key is enough (no account-level API calls at runtime).
 * The recipient comes ONLY from QUOTE_TO (no built-in fallback). If MAILGUN_API_KEY or QUOTE_TO is
 * missing, this returns null with the missing names, and the forms answer "not configured".
 */
export function getMailgunConfig(): MailgunConfig | null {
  const missing = mailgunConfigMissing();
  if (missing.length) return null;
  return {
    apiKey: process.env.MAILGUN_API_KEY!.trim(),
    to: process.env.QUOTE_TO!.trim(),
    domain: process.env.MAILGUN_DOMAIN?.trim() || "autumnstar.ca",
    // US region by default; EU accounts set https://api.eu.mailgun.net
    apiBase: mailgunApiBase(),
    from: process.env.QUOTE_FROM?.trim() || "Autumn Star <admin@autumnstar.ca>",
  };
}

/** Names of required mail settings that are not set (for the server log; never sent to the browser). */
export function mailgunConfigMissing(): string[] {
  return ["MAILGUN_API_KEY", "QUOTE_TO"].filter((k) => !process.env[k]?.trim());
}

// Mailgun regions. In production only these are accepted (EU accounts set MAILGUN_API_BASE to the EU URL);
// any other value, e.g. a local mock server used by the form tests, is ignored when NODE_ENV=production.
const MAILGUN_API_BASES = ["https://api.mailgun.net", "https://api.eu.mailgun.net"];

function mailgunApiBase(): string {
  const requested = (process.env.MAILGUN_API_BASE?.trim() || "").replace(/\/+$/, "");
  if (!requested) return MAILGUN_API_BASES[0];
  if (MAILGUN_API_BASES.includes(requested)) return requested;
  if (process.env.NODE_ENV !== "production") return requested; // test-only override (mock Mailgun)
  console.warn("[mail] MAILGUN_API_BASE ignored in production (not an official Mailgun endpoint)");
  return MAILGUN_API_BASES[0];
}
