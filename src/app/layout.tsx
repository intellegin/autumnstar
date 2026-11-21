import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Lato } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics";
import { phone, site } from "@/lib/content";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import "./globals.css";

// Lato, per the Autumn Star Brand Guide. Self-hosted at build time by next/font (no runtime requests to Google).
const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-lato", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.displayName} | ${site.tagline}`, template: `%s | ${site.shortName}` },
  description: site.description,
  applicationName: site.shortName,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: site.shortName, statusBarStyle: "black-translucent" },
  other: { "apple-mobile-web-app-capable": "yes" },
  openGraph: { type: "website", siteName: site.displayName, locale: "en_CA", images: [DEFAULT_OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [{ url: DEFAULT_OG_IMAGE.url, alt: DEFAULT_OG_IMAGE.alt }] },
};

export const viewport: Viewport = { themeColor: "#1f2e3a", width: "device-width", initialScale: 1 };

function organization() {
  const p = phone();
  // Only true fields: contact details are added automatically once confirmed in content/site.json.
  // LocalBusiness is not used: no street address is published.
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.displayName,
        alternateName: site.shortName,
        url: site.url,
        logo: { "@type": "ImageObject", url: `${site.url}/brand/logo.png`, width: 1056, height: 303 },
        image: `${site.url}/og-image.png`,
        description: site.description,
        slogan: site.tagline,
        ...(p ? { telephone: p.e164 } : {}),
        ...(site.contact.email ? { email: site.contact.email } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.shortName,
        alternateName: site.displayName,
        url: site.url,
        inLanguage: "en-CA",
        publisher: { "@id": `${site.url}/#organization` },
      },
    ],
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render per request so Next.js can apply the CSP nonce from src/proxy.ts to its scripts.
  await connection();
  return (
    <html lang="en-CA" className={lato.variable}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <JsonLd data={organization()} />
        <Analytics />
      </body>
    </html>
  );
}
