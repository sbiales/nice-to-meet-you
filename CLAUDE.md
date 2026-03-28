# Nice To Meet You

A personal landing page creator for real-world social discovery. People print a QR code on a tote bag, business card, hat, etc. The QR code links to their page — a cross between a dating profile, personal website, and resume. Use cases include dating, making friends, professional networking, or simply having a shareable personal presence. The value proposition is intentional self-presentation with a built-in privacy layer: strangers can get in touch without ever seeing your personal contact details.

## Core Concept

- **Not** a dating app (no matching, no feed, no algorithm)
- **Not** a social network (no followers, no posts)
- **Yes** a personal pitch page: who you are, what you love, what you're looking for, how to reach you
- **Yes** privacy-first: contact form routes to owner's email without exposing it; social links are optional and toggleable

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | Nuxt 3 + TypeScript | Vue meta-framework, SSR via `node-server` preset |
| Styling | Tailwind CSS | Component library TBD |
| Database | Neon (Postgres) | Standard Postgres — swap via connection string |
| ORM | Drizzle | TypeScript-first, generates plain SQL |
| Auth | Better Auth | Runs inside the app, no external service |
| File storage | Cloudflare R2 | S3-compatible API, no egress fees |
| Email | Resend | Contact form forwarding, transactional email |
| Hosting | Fly.io | Docker container, Node.js runtime |
| QR codes | `qrcode` npm | Server-side generation |

## Rendering Strategy

Using Nuxt route rules for hybrid rendering:

```ts
routeRules: {
  '/': { prerender: true },        // marketing/landing page
  '/dashboard/**': { ssr: false }, // auth-gated app shell, CSR only
  '/:username': { ssr: true },     // public profile pages — must SSR for OG tags + perf
}
```

Public profile pages require SSR for two reasons:
1. First paint performance (QR scan → page must feel instant)
2. Open Graph meta tags for social sharing previews (crawlers don't execute JS)

## Local Development

Run backing services via Docker Compose. The Nuxt app runs on the host with `nuxt dev`.

| Docker service | Stands in for | Port |
|---|---|---|
| `postgres:16-alpine` | Neon | 5432 |
| `minio/minio` | Cloudflare R2 | 9000 (API), 9001 (console) |
| `axllent/mailpit` | Resend | 1025 (SMTP), 8025 (web UI) |

```bash
docker compose up -d  # start backing services
nuxt dev              # start app
```

Environment switching is purely via `.env`:
- `.env.local` — points to Docker services (gitignored)
- `.env.production` — points to production services (never committed)
- `.env.example` — committed, documents required variables

## Data Model

Better Auth manages its own tables (`user`, `session`, `account`, `verification`). Our schema references `user.id` but does not redefine it.

### `profiles`
Core identity and layout for the public page. 1:1 with `user` (enforced by UNIQUE on `user_id`) — relaxable in v2 for multiple profile types.

```
id                uuid PK
user_id           uuid FK → user.id  UNIQUE
username          text UNIQUE NOT NULL        -- URL slug: nicetomeetyou.app/username
display_name      text NOT NULL
status            enum(active, taken, paused) DEFAULT active
header_image_key  text                        -- R2 object key for banner image
theme             jsonb DEFAULT '{}'          -- colors, fonts, layout; validated in app layer
blocks            jsonb DEFAULT '[]'          -- ordered content blocks array (see below)
is_contactable    boolean DEFAULT true
deleted_at        timestamptz                 -- soft delete
created_at        timestamptz
updated_at        timestamptz
```

**Blocks** are typed `{ type, data }` objects. Adding a new block type = new TS type + new Vue component, no migration needed. Initial block types:
- `bio` — rich text
- `photo_single` — one photo + optional caption
- `photo_carousel` — multiple photos referenced by photo ID
- `looking_for` — text (flexible: dating, friends, networking, etc.)
- `interests` — string tag array
- `social_links` — renders from `social_links` table
- `contact_button` — renders contact form trigger

### `photos`
Managed separately from blocks for asset lifecycle (upload, delete, reorder). Blocks reference by `photo_id`.

```
id           uuid PK
profile_id   uuid FK → profiles.id
storage_key  text NOT NULL    -- R2 object key (not a full URL — constructed at runtime)
sort_order   int DEFAULT 0
created_at   timestamptz
```

### `social_links`
```
id          uuid PK
profile_id  uuid FK → profiles.id
platform    enum(instagram, spotify, linkedin, twitter, tiktok, youtube, website, other)
url         text NOT NULL
is_visible  boolean DEFAULT false    -- hidden by default
sort_order  int DEFAULT 0
```

### `contact_messages`
Stored (not just forwarded) to enable v2 inbox. Owner email never exposed; sender provides theirs voluntarily if they want a reply.

```
id            uuid PK
profile_id    uuid FK → profiles.id
sender_name   text
sender_email  text
message       text NOT NULL
is_read       boolean DEFAULT false
sent_at       timestamptz
```

### `reports`
```
id                uuid PK
profile_id        uuid FK → profiles.id
reporter_user_id  uuid FK → user.id  (nullable — anonymous reports allowed)
reason            text
created_at        timestamptz
```

## Key Design Decisions

- **Lock-in is minimized at every layer**: Neon = standard Postgres, R2 = S3 API, Fly.io = Docker container
- **Pages are not search-engine indexed by default** — privacy is the product
- **No messaging platform in v1** — contact form → email is sufficient; inbox is a later feature
- **No custom domains in v1** — pages live at `nicetomeetyou.app/username`

## v1 Feature Scope

**In:**
- Account creation (email/password + social login)
- Block-based profile builder: ordered content blocks (bio, photos, interests, looking for, social links, contact button)
- Single photo block with caption OR photo carousel block
- Header/banner image (Facebook-style top-of-page)
- Page themes: colors, fonts, layout style (jsonb, validated in app layer)
- Contact form (routes to owner email, no personal info exposed)
- Social link toggles (Instagram, Spotify, LinkedIn etc.) — off by default
- Active / Taken / Paused status (or custom status text)
- QR code generation and download
- Report page flow

**Out (later):**
- In-app inbox/messaging
- Custom domains
- Page analytics
- Social link "unlock after contact" gating
- Mobile app

## v2 Monetization Direction

Integrated print-on-demand purchasing: after generating their QR code, users get a one-click path to order physical items (tote bags, hats, business cards, stickers) with their QR code pre-applied to a design template. The app would earn a cut via a print-on-demand partner API.

Research still needed on partner options (Printful, Printify, Gelato, etc.) — this is intentionally undesigned for now. No schema or API work should be done for this until v1 is shipped.
