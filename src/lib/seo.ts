/**
 * Per-page SEO metadata: title, description, canonical, Open Graph and Twitter card in one place.
 * Canonicals, og:url and the sitemap are built from site.url in content/site.json (the single
 * "site URL" setting; intended production domain https://www.autumnstar.ca).
 */
import type { Metadata } from "next";
import { site } from "./content";

export type OgImage = { url: string; alt: string; width?: number; height?: number };

export const DEFAULT_OG_IMAGE: OgImage = { url: "/og-image.png", width: 1200, height: 630, alt: site.displayName };

type Input = {
  /** Page title; the "| Autumn Star" suffix is added unless `absoluteTitle` is set. */
  title?: string;
  absoluteTitle?: string;
  description: string;
  /** Path of the page, e.g. "/services/ocean-freight" (used for canonical and og:url). */
  path: string;
  /** 1200x630 share image; defaults to the site image. */
  image?: OgImage;
  type?: "website" | "article";
};

export function pageMeta({ title, absoluteTitle, description, path, image = DEFAULT_OG_IMAGE, type = "website" }: Input): Metadata {
  const fullTitle = absoluteTitle ?? (title ? `${title} | ${site.shortName}` : `${site.shortName} | ${site.tagline}`);
  const img = { width: 1200, height: 630, ...image };
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: site.displayName, locale: "en_CA", url: path, title: fullTitle, description, images: [img] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [{ url: img.url, alt: img.alt }] },
  };
}

/** Absolute URL for JSON-LD. */
export const abs = (path: string) => `${site.url}${path === "/" ? "" : path}`;
