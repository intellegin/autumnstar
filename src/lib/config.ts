/**
 * Central server-side configuration: the only place environment variables are read.
 * Email is sent only through Mailgun (owner rule: no unapproved third-party services).
 */
export type MailgunConfig = { apiKey: string; domain: string; apiBase: string; from: string; to: string };

export function getMailgunConfig(): MailgunConfig | null {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    // Safe defaults (owner-confirmed), so mail still works if a variable is missing or named differently.
    to: process.env.QUOTE_TO?.trim() || "admin@autumnstar.ca",
    domain: process.env.MAILGUN_DOMAIN?.trim() || "autumnstar.ca",
    // US region by default; EU accounts set https://api.eu.mailgun.net
    apiBase: (process.env.MAILGUN_API_BASE?.trim() || "https://api.mailgun.net").replace(/\/+$/, ""),
    from: process.env.QUOTE_FROM?.trim() || "Autumn Star <admin@autumnstar.ca>",
  };
}
