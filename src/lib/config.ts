/**
 * Central server-side configuration: the only place environment variables are read.
 * Email is sent only through Mailgun (owner rule: no unapproved third-party services).
 */
export type MailgunConfig = { apiKey: string; domain: string; apiBase: string; from: string; to: string };

export function getMailgunConfig(): MailgunConfig | null {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const to = process.env.QUOTE_TO?.trim(); // recipient not confirmed yet, so no default
  if (!apiKey || !to) return null;
  return {
    apiKey,
    to,
    domain: process.env.MAILGUN_DOMAIN?.trim() || "mail.autumnstar.ca",
    // US region by default; EU accounts set https://api.eu.mailgun.net
    apiBase: (process.env.MAILGUN_API_BASE?.trim() || "https://api.mailgun.net").replace(/\/+$/, ""),
    from: process.env.QUOTE_FROM?.trim() || "Autumn Star <quotes@mail.autumnstar.ca>",
  };
}
