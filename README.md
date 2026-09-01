# E-Invitation — Censmar & Eduardo

A wedding e-invitation with six switchable themes (living gradients included), a couple-photo hero slideshow, parallax botanical vines, a vinyl-style Spotify player, guest photo sharing via QR code, and a printable A6 table postcard.

Built with Next.js (App Router) + TypeScript + Tailwind CSS v4 + framer-motion. Photos are stored in Cloudinary; settings live in Upstash Redis (or a local JSON file) — no traditional database required.

## Features

- **Invitation page** (`/`)
  - "Open Invitation" cover gate (personalized via `?to=Guest+Name`), Ken Burns hero slideshow of the couple's photos
  - Scroll-driven parallax: gradient orbs, floating polaroid side-photos, interactive green vines that grow as guests scroll and bloom flowers on tap
  - Countdown, church/ceremony + reception cards with Maps links, vinyl-record music player
  - Live guest-photo gallery with lightbox
- **Guest uploads** (`/upload`) — QR-code target: optional guest name, client-side compression
- **QR postcard** (`/qr`) — print-perfect A6 landscape table card in the active theme
- **Admin panel** (`/admin`) — passcode-protected:
  - **Theme** — six palettes applied site-wide instantly (Dusty Pink, Sage & Cream, Navy & Gold, Terracotta, Lavender Mist, Classic Ivory)
  - **Content** — bride/groom names (first + full), date/time & timezone label, church, reception venue, events, Spotify playlist URL
  - **Photos** — upload/delete/reorder hero photos; tick “Beside story” to also float them along the page edges
- **Safeguards** — HMAC-signed admin session cookie, per-IP rate limiting on login/uploads, MIME/size validation

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSCODE` | for `/admin` | Passcode for the admin panel — pick something strong |
| `CLOUDINARY_CLOUD_NAME` | for uploads/photos | Cloudinary account name |
| `CLOUDINARY_API_KEY` | for uploads/photos | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | for uploads/photos | Cloudinary API secret |
| `UPSTASH_REDIS_REST_URL` | recommended on Vercel | Settings storage (free tier works) |
| `UPSTASH_REDIS_REST_TOKEN` | recommended on Vercel | Upstash REST token |
| `NEXT_PUBLIC_SITE_URL` | recommended in prod | Absolute URL used for OG tags |

Without Cloudinary the site runs fine — uploads show a friendly notice and the hero falls back to the gradient. Without Upstash, settings persist to `.data/settings.json` (great locally; not persistent on serverless).

### Cloudinary setup

1. Free account at [console.cloudinary.com](https://console.cloudinary.com)
2. Dashboard → Settings → API Keys → copy the three values into `.env.local`
3. Couple photos → `wedding/couple` folder (tagged `couple-hero`); guest photos → `wedding/gallery` (tagged `wedding-gallery`, uploader name kept as context metadata)
4. Moderate/delete: Media Library → filter by tag

### Upstash setup (for Vercel)

1. Free account at [console.upstash.com](https://console.upstash.com) → create a **Regional** database (pick the region nearest your Vercel region)
2. Open the database → **REST API** section → copy the URL and token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

## Customizing everything at `/admin`

All content is edited live from the admin panel — names, date/time (any format parseable as an ISO date string, e.g. `2026-10-10T14:00:00+08:00`), event times, venues, Maps links, playlist. The seeded defaults come from `src/config/wedding.ts`.

Spotify: your playlist → Share → Copy link → paste into the admin Content tab.

## Printing the QR postcard

1. Open `/qr` (QR always encodes the current domain)
2. Print → set paper to **A6 / 148×105 mm**, enable **background graphics**, margins **none**
3. **Print only after your final domain is live** — printed codes are frozen images

## Deploying to Vercel

1. Push to GitHub and import in Vercel
2. Add all environment variables (including Upstash + admin passcode)
3. Redeploy, then open `/admin`, pick your theme, upload couple photos, edit content

## Running with Docker

```bash
docker compose up -d          # build + serve on http://localhost:3000
docker compose logs -f web    # tail logs
docker compose down           # stop
```

Settings persist across rebuilds via the `wedding-settings` volume mounted at `/app/.data`. Environment variables are read from your shell or a project-root `.env` file.

## Notes

- Spotify embeds play 30-second previews for visitors not logged in (platform limitation); full playback needs a free Spotify account
- The gallery list is cached 60 s to respect Cloudinary Admin API rate limits
- Parallax/vines/blossoms respect `prefers-reduced-motion`
