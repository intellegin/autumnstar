import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics";
import { phone, site } from "@/lib/content";
import "./globals.css";

// Self-hosted at build time by next/font (no runtime requests to Google).
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.displayName} | ${site.tagline}`, template: `%s | ${site.shortName}` },
  description: site.description,
  applicationName: site.shortName,
  alternates: { canonical: "/" },
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
  openGraph: { type: "website", siteName: site.displayName, locale: "en_CA", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: site.displayName }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#1f2e3a", width: "device-width", initialScale: 1 };

function organization() {
  const p = phone();
  // Only true fields: contact details are added automatically once confirmed in content/site.json.
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.displayName,
    alternateName: site.shortName,
    url: site.url,
    logo: `${site.url}/brand/logo.png`,
    slogan: site.tagline,
    ...(p ? { telephone: p.e164 } : {}),
    ...(site.contact.email ? { email: site.contact.email } : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${sora.variable} ${plex.variable}`}>
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
