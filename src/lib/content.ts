/**
 * Content layer: reads /content and validates it at build time, so a typo in
 * a content file fails the build instead of shipping a broken page.
 * Server-only (uses the file system).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import siteJson from "@content/site.json";
import homeJson from "@content/pages/home.json";
import servicesJson from "@content/pages/services.json";
import globalJson from "@content/pages/global-reach.json";
import aboutJson from "@content/pages/about.json";
import quoteJson from "@content/pages/quote.json";
import contactJson from "@content/pages/contact.json";

export type Link = { label: string; href: string };

export type Site = {
  displayName: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  contact: { phone: string; email: string; address: string };
  nav: Link[];
  quoteCta: Link;
};

export type ServiceSection = { title: string; text: string; image?: string; imageAlt?: string };

export type Service = {
  slug: string;
  name: string;
  order: number;
  icon: string;
  featured: boolean;
  short: string;
  summary: string;
  image: string;
  imageAlt: string;
  heroImage: string;
  heroImageAlt: string;
  intro: string;
  sections: ServiceSection[];
  quoteChecklist: string[];
};

class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`Invalid content in ${file}: ${message}`);
    this.name = "ContentError";
  }
}

function str(value: unknown, file: string, field: string, required = true): string {
  if (value == null || value === "") {
    if (required) throw new ContentError(file, `"${field}" is required`);
    return "";
  }
  if (typeof value !== "string") throw new ContentError(file, `"${field}" must be text`);
  return value.trim();
}

function image(value: unknown, file: string, field: string): string {
  const src = str(value, file, field);
  if (!src.startsWith("/images/")) throw new ContentError(file, `"${field}" must be a self-hosted path under /images/`);
  if (!fs.existsSync(path.join(process.cwd(), "public", src))) throw new ContentError(file, `"${field}" file not found: public${src}`);
  return src;
}

export const site = siteJson as Site;

export const pages = {
  home: homeJson,
  services: servicesJson,
  globalReach: globalJson,
  about: aboutJson,
  quote: quoteJson,
  contact: contactJson,
};

const SERVICES_DIR = path.join(process.cwd(), "content", "services");

function loadService(fileName: string): Service {
  const file = `content/services/${fileName}`;
  const { data } = matter(fs.readFileSync(path.join(SERVICES_DIR, fileName), "utf8"));
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const img = image(data.image, file, "image");
  return {
    slug: fileName.replace(/\.md$/, ""),
    name: str(data.name, file, "name"),
    order: Number(data.order ?? 99),
    icon: str(data.icon, file, "icon"),
    featured: data.featured === true,
    short: str(data.short, file, "short"),
    summary: str(data.summary, file, "summary"),
    image: img,
    imageAlt: str(data.imageAlt, file, "imageAlt"),
    heroImage: data.heroImage ? image(data.heroImage, file, "heroImage") : img,
    heroImageAlt: str(data.heroImageAlt, file, "heroImageAlt", false) || str(data.imageAlt, file, "imageAlt"),
    intro: str(data.intro, file, "intro"),
    sections: sections.map((s: Record<string, unknown>, i: number) => ({
      title: str(s.title, file, `sections[${i}].title`),
      text: str(s.text, file, `sections[${i}].text`),
      ...(s.image ? { image: image(s.image, file, `sections[${i}].image`), imageAlt: str(s.imageAlt, file, `sections[${i}].imageAlt`) } : {}),
    })),
    quoteChecklist: Array.isArray(data.quoteChecklist) ? data.quoteChecklist.map(String) : [],
  };
}

let cache: Service[] | null = null;

export function getServices(): Service[] {
  if (!cache) {
    cache = fs.readdirSync(SERVICES_DIR).filter((f) => f.endsWith(".md")).map(loadService).sort((a, b) => a.order - b.order);
  }
  return cache;
}

export function getService(slug: string): Service | undefined {
  return getServices().find((s) => s.slug === slug);
}

/** Phone (if set) formatted for display and links. Empty object when not set. */
export function phone() {
  const p = site.contact.phone;
  if (!p) return null;
  const m = p.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return { e164: p, display: m ? `(${m[1]}) ${m[2]}-${m[3]}` : p, tel: `tel:${p}` };
}
