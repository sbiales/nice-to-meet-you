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

## Development Notes

Learnings discovered during scaffold setup:

1. **Nuxt 4 directory structure**: The project uses Nuxt 4 (not 3 as originally planned). Client-side code lives under `app/` (app/pages/, app/layouts/, app/components/, app/assets/). Server code stays at `server/`. Config files at root.

2. **npm --legacy-peer-deps**: `better-auth` has a transitive peer dep conflict with Nuxt 4's vite version (via @sveltejs/vite-plugin-svelte). Use `npm install --legacy-peer-deps` when adding packages that conflict.

3. **Docker via WSL**: Docker Desktop is not installed. Docker Engine runs inside WSL2 Ubuntu. From the Windows shell, prefix docker commands with `wsl -e` or `wsl bash -c "..."`. The docker daemon must be started manually: `wsl bash -c "sudo service docker start"`.

4. **Server-side imports**: The `~` alias does NOT resolve inside `server/` directory in Nuxt 4. Use relative imports for server-to-server references (e.g., `../../lib/auth` not `~/server/lib/auth`).

5. **TypeScript checking**: Use `npx nuxi typecheck` (not `npx tsc --noEmit`) — Nuxt generates its own tsconfig references.

6. **Env file for local dev**: Nuxt dev only auto-loads `.env`, not `.env.local`. Keep local values in `.env.local` as the source of truth, but copy to `.env` before running: `cp .env.local .env`. Both are gitignored. Never commit `.env`.

7. **Missing peer deps**: `better-auth` requires `@opentelemetry/api` which is not auto-installed. If you see a missing package error from `better-auth/core/dist/instrumentation/tracer.mjs`, run `npm install @opentelemetry/api --legacy-peer-deps`.

8. **Playwright testing at phase end only**: Run Playwright verification once at the end of a phase — not after individual tasks. Use the `mcp__plugin_playwright_playwright__*` tools to navigate pages and confirm everything renders without errors before creating the PR.

## Implementation Workflow

Rules for executing implementation phases. These override skill defaults.

1. **Always use subagent-driven development**: All phases must be executed using the `superpowers:subagent-driven-development` skill. Never implement tasks directly in the main context.

2. **Spec compliance review per task; no per-task code quality review**: After each task, dispatch a spec compliance reviewer (haiku model). Skip the per-task code quality review — run a single code quality review at the very end after all tasks are complete.

3. **Use haiku for spec compliance reviewers**: Spec compliance review is mechanical. Always use `model: "haiku"` when dispatching spec reviewer subagents.

4. **Keep orchestration in the orchestrator**: Never investigate bugs, read files, or reason through problems in the main context. If something goes wrong mid-run, dispatch a dedicated fix subagent with specific instructions.

5. **Phase completion checklist** — in order:
   - Run `npm test` and `npx nuxi typecheck` — must be clean
   - Run Playwright verification (once, at the end)
   - Push branch and open a PR with a meaningful description covering all changes
   - Kill the dev server: `npx kill-port 3000` (it is always still running)
