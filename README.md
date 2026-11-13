# autumnstar.ca

Website for **Autumn Star Shipping & Logistics**: *Moving Business Across Borders.*

Next.js (App Router) on Vercel. The design follows the Autumn Star Brand Guide: about 70% navy and neutrals, 20% orange, 10% gold, with Lato type. Every page is pre-rendered as static HTML; the only server code is two form endpoints, `/api/quote` and `/api/contact`.

> This repository is **public**. Never commit secrets, `.env` files or customer data. API keys live in Vercel environment variables.

## Editing content (no code needed)

Text, services and settings live in [`content/`](content/). Edit a file and commit; Vercel redeploys. The build checks the content and stops with a clear message if something is wrong, such as a missing image file.

| File | What it controls |
|---|---|
| `content/site.json` | Name, tagline, description, navigation, and **contact details** (`phone`, `email`, `address`). Contact details are empty for now; each appears on the site automatically once filled in. |
| `content/services/*.md` | **One file per service.** The file name becomes the page address, e.g. `/services/ocean-freight`. Fields: `name`, `order`, `icon`, `short`, `summary`, `image`, `intro`, `sections`, `quoteChecklist`. |
| `content/pages/*.json` | Text for Home, Services, Global Reach, About, Request a Quote and Contact. |

Placeholders waiting for the owner (search `content/` for `TODO (owner)`):
- `site.json` → `contact.phone`, `contact.email`, `contact.address`
- `pages/about.json` → `story` (company background; hidden while empty)
- `pages/global-reach.json` → `regions` (confirmed service regions; hidden while empty)

Content rules: describe services at capability level ("we arrange / coordinate"). Don't claim licences, facilities, a fleet, regions, transit times, guarantees, testimonials or history until confirmed.

Images: free commercial licences only, self-hosted in `public/images/photos/`. Record each one in the design docs' `images.md`.

## Quote and contact email (Mailgun only)

Both forms post to the site's own server routes. Those routes validate the input, reject bots (hidden honeypot field plus minimum fill time), apply a basic per-IP rate limit, assign a **reference number** (`AS-Q-YYMMDD-XXXX` for quotes, `AS-C-…` for contact), and send the email through Mailgun with Reply-To set to the customer.

The reference number appears in the email subject and on the success screen; this is the inquiry tracking. If sending fails or isn't configured, the form shows "please try again later".

**Owner rule: no third-party services unless approved.** Approved: GitHub, Vercel, Mailgun. That means no form services, analytics, trackers, external widgets or maps. Fonts are self-hosted through `next/font`, and all images are served from this repo.

### Environment variables (Vercel → Project → Settings → Environment Variables → Production)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MAILGUN_API_KEY` | **yes** | none | Mailgun API key |
| `MAILGUN_DOMAIN` | no | `autumnstar.ca` | Mailgun sending domain |
| `QUOTE_TO` | no | `admin@autumnstar.ca` | Inbox that receives quote and contact requests |
| `QUOTE_FROM` | no | `Autumn Star <admin@autumnstar.ca>` | Sender |
| `MAILGUN_API_BASE` | no | `https://api.mailgun.net` (US) | Only for EU Mailgun accounts: `https://api.eu.mailgun.net` |

Redeploy after changing environment variables.

## Analytics

None, by design: analytics aren't approved yet. If Vercel Web Analytics is approved, add `@vercel/analytics` and render its component in `src/components/Analytics.tsx`. That file is already included in the layout.

## Icons and home-screen app

- Favicons: `public/favicon.ico` (16/32/48), `favicon-16.png`, `favicon-32.png`.
- iOS home screen: `apple-touch-icon.png` (180).
- Android and desktop install: `public/icons/icon-192.png`, `icon-512.png`, plus padded `maskable-*.png`.
- Manifest: `public/site.webmanifest`.

All are generated from the approved logo files.

## Project structure

```
content/                 editable content (see above)
public/brand/            logo (full colour, white), mark
public/images/photos/    licensed photos
public/icons/            web app icons; favicons + manifest in public/
src/app/                 pages (one folder per URL), api/quote, api/contact, sitemap.ts, robots.ts
src/components/          header + services dropdown, mobile drawer + bar, hero quick-quote, service directory,
                         route process, quote (4 steps) and contact forms, footer, analytics slot
src/lib/content.ts       loads + validates content/
src/lib/config.ts        environment variables (the only place they're read)
src/lib/inquiry.ts       form fields + validation (shared by forms and API)
src/lib/mail.ts          spam checks, rate limit, reference numbers, Mailgun send
vercel.json              pins the framework preset to Next.js
```

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also checks types and content)
```

Requires Node 20.9+.
