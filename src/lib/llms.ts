/**
 * /llms.txt and /llms-full.txt: plain-text (Markdown) summary for AI assistants, generated from the
 * same content files as the site so it stays in sync. Facts only (capability-level, as on the site).
 */
import { getServices, pages, phone, site } from "./content";

const url = (p: string) => `${site.url}${p}`;

function header(): string[] {
  const p = phone();
  const lines = [
    `# ${site.displayName}`,
    "",
    `> ${site.description}`,
    "",
    `${site.displayName} ("${site.shortName}") is a shipping and logistics company. Its primary focus is ocean freight worldwide, with air freight, ground transportation (trucking, parcel and last-mile), freight coordination and supply chain solutions. Tagline: "${site.tagline}"`,
    "",
    "- Services are arranged per request; pricing and availability are provided by quote.",
    `- Request a quote: ${url(site.quoteCta.href)}`,
    `- Contact form: ${url("/contact")}`,
  ];
  if (p) lines.push(`- Phone: ${p.display}`);
  if (site.contact.email) lines.push(`- Email: ${site.contact.email}`);
  lines.push("");
  return lines;
}

export function llmsTxt(): string {
  const lines = header();
  lines.push("## Pages", "");
  lines.push(`- [Home](${url("/")}): ${pages.home.seo.description}`);
  lines.push(`- [Services](${url("/services")}): ${pages.services.seo.description}`);
  lines.push(`- [Global Reach](${url("/global-reach")}): ${pages.globalReach.seo.description}`);
  lines.push(`- [About](${url("/about")}): ${pages.about.seo.description}`);
  lines.push(`- [Request a Quote](${url("/quote")}): ${pages.quote.seo.description}`);
  lines.push(`- [Contact](${url("/contact")}): ${pages.contact.seo.description}`);
  lines.push("", "## Services", "");
  for (const s of getServices()) lines.push(`- [${s.name}](${url(`/services/${s.slug}`)})${s.featured ? " (primary focus)" : ""}: ${s.summary}`);
  lines.push("", "## Optional", "", `- [Full service details](${url("/llms-full.txt")}): each service with what it covers and what to include in a quote request.`, "");
  return lines.join("\n");
}

export function llmsFullTxt(): string {
  const lines = header();
  for (const s of getServices()) {
    lines.push(`## ${s.name}${s.featured ? " (primary focus)" : ""}`, "", s.summary, "", s.intro, "", `Page: ${url(`/services/${s.slug}`)}`, "");
    for (const sec of s.sections) lines.push(`- **${sec.title}:** ${sec.text}`);
    if (s.quoteChecklist.length) lines.push("", "To get a quote, include:", ...s.quoteChecklist.map((c) => `- ${c}`));
    lines.push("");
  }
  return lines.join("\n");
}
