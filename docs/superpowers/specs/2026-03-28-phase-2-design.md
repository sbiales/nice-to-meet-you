# Phase 2: Profile Creation Onboarding + Landing Page — Design Spec

**Date:** 2026-03-28
**Status:** Approved

---

## Overview

Phase 2 covers two independent, parallelizable pieces:

1. **Onboarding flow** — a post-signup page that captures username and display name, creates the `profiles` row, and redirects to the dashboard.
2. **Landing page** — a full marketing homepage replacing the current palette-sampler placeholder at `/`.

Both build on the design system established in Phase 1 (sage green palette, DM Sans, warm neutrals, base components).

---

## Piece 1: Onboarding Flow

### Goal

Every authenticated user must have a `profiles` row before using the dashboard. Onboarding captures the two required non-nullable fields (username, display name) and creates that row. It is not skippable — but it is minimal and fast.

All other profile content (bio, photos, blocks, social links, etc.) is deferred to the dashboard editor in Phase 4.

### Route

`/onboarding`

### Layout

Uses the existing `auth` layout (centered card, same visual treatment as sign in / sign up). Feels like a natural continuation of the auth flow.

### Route Middleware

A Nuxt route middleware (`profile-required`) runs on all `/dashboard/**` routes:
- If the user is unauthenticated → redirect to `/signin`
- If the user is authenticated but has no profile row → redirect to `/onboarding`
- If the user is authenticated and has a profile → allow through

A second guard on `/onboarding` itself:
- If the user is unauthenticated → redirect to `/signin`
- If the user already has a profile → redirect to `/dashboard`

### Page

Single form with two fields:

| Field | Label | Pre-fill | Validation |
|---|---|---|---|
| `username` | "Choose your username" | Email prefix before `@` | Required. 3–30 chars. Lowercase letters, numbers, underscores only (`/^[a-z0-9_]{3,30}$/`). Not a reserved word (validated client-side against existing `app/lib/reserved-usernames.ts`). Unique (debounced API check). |
| `display_name` | "Your display name" | Better Auth `user.name` if set (OAuth), otherwise email prefix | Required. 1–60 chars. No format restriction. |

**CTA:** "Let's go →" (primary AppButton, submit type). Disabled while loading or while username has an unresolved availability check.

**Error states:**
- Username taken → inline error under the field: "That username is taken"
- Username invalid format → inline: "Usernames can only contain letters, numbers, and underscores"
- Server error on submit → inline error at form level

**On success:** Profile row created, redirect to `/dashboard`.

### API

`POST /api/profiles`

- Auth-gated (must be signed in)
- Body: `{ username: string, displayName: string }`
- Creates a row in `profiles` with `userId`, `username`, `displayName`, defaults for all other fields
- Returns the created profile
- Errors: 409 if username taken, 400 if validation fails, 401 if unauthenticated

`GET /api/profiles/check-username?username=foo`

- Returns `{ available: boolean }`
- Used for debounced real-time availability check (300ms debounce)
- Does not require auth

### Testing (TDD)

Write tests before implementation for:
- Username format validation (unit — the validator function)
- Reserved username list (unit)
- `POST /api/profiles` endpoint (integration — happy path, duplicate username, invalid format, unauthenticated)
- `GET /api/profiles/check-username` endpoint (integration — available, taken)
- Route middleware behavior (unit or integration)

---

## Piece 2: Landing Page

### Goal

A professional, fleshed-out marketing page that pitches the product, explains how it works, and converts visitors to sign up.

### Route

`/` — prerendered (no backend dependency, fast static delivery)

### Layout

Uses the existing `default` layout (a bare wrapper). The landing page is self-contained — the nav, hero, and all sections live inside the page component itself. The layout just provides the outer shell. The current `default.vue` uses `bg-white`; update it to `bg-warm-bg` for consistency with the design system.

### Font Addition

A handwriting-style Google Font for the hero headline and logo. Options to be surfaced during implementation for design review (candidates: Caveat, Satisfy, Reenie Beanie). The chosen font is used only for display/hero text — body copy stays DM Sans.

### Page Structure

#### 1. Nav Bar
- Sticky, full-width, `warm-card` background with a subtle bottom border
- **Left:** Minimal wordmark "ntmy" in DM Sans, links to `/`
- **Right:** Ghost "Sign in" link (`/signin`) + primary "Get started" button (`/signup`)
- Collapses gracefully on mobile (sign in / get started remain visible)

#### 2. Hero
- **Background:** `sage-400` (`#839a76`). All hero text in white.
- **Decorative element:** A soft CSS/SVG shape (blob, arc, or swirl) in sage-300 or sage-500 layered behind the text for visual interest. Exact treatment to be iterated on during the design review — implementation should make a first attempt and capture a screenshot.
- Centered layout, generous vertical padding
- **Display:** "Nice To Meet You" — large, in the handwriting font. This is the brand statement, not a headline.
- **Tagline:** "Become approachable without saying a word" — smaller, italic DM Sans, directly beneath the display text. White.
- **Subheadline:** 1–2 sentences expanding the idea (e.g. "Nice To Meet You gives you a personal page that speaks for you. Print your QR code, put it in the world, and let people reach out on their terms.") White or white/80.
- **CTAs:** Primary "Create your page" (`/signup`, white background + sage-700 text) + Ghost/secondary "See how it works" (white border + white text, smooth-scrolls to How It Works section)

#### 3. Why We Made This
- Lightly tinted sage background (`sage-50` or `sage-100`) to visually separate from hero
- Short editorial paragraphs: everyone is online, but real-world moments still happen. Dating apps feel transactional. Meeting someone in a coffee shop is still magic. This is a tool for being approachable — for singles, for people looking to make friends, for anyone who wants to put themselves out there without the awkwardness.
- Warm, human tone. Not marketing-speak.

#### 4. How It Works
- `id="how-it-works"` anchor for the hero scroll CTA
- 3 numbered steps, horizontal on desktop / stacked on mobile:
  1. **Create your page** — set up your profile: who you are, what you love, what you're looking for
  2. **Generate your QR code** — download it, print it, put it on whatever you want
  3. **Put yourself out there** — someone scans it, reads your page, reaches out. No awkward introductions required.
- Clean layout with large step numbers in sage green

#### 5. Value Props
- 4 cards or columns, horizontal on desktop / 2×2 grid on mobile:
  - **Privacy-first** — your email and contact details are never exposed
  - **No algorithm** — no feed, no matching, no pressure. Just your page.
  - **Works for everyone** — dating, friendship, networking, or just having a link to share
  - **Free to start** — create your page for free, print your QR code, and go

#### 6. Footer
- Minimal: "© 2026 Nice To Meet You"
- Links: Sign in, Get started

### Testing (TDD)

The landing page is a prerendered static page with no API calls, so unit/integration tests are minimal. Testing focus:
- Playwright: verify all 6 sections render, nav links resolve correctly, "See how it works" scroll works, CTA buttons link to correct routes

---

## Shared Decisions

- Both pieces use the existing sage/warm design tokens — no new tokens needed
- Both pieces use existing base components (AppButton, AppInput, AppCard) where applicable
- Playwright verification required for all new pages before committing
- Design review checkpoint after Phase 2 implementation (screenshots of onboarding page and landing page presented for approval before Phase 3 begins)

---

## Out of Scope for Phase 2

- Dashboard content (Phase 4)
- Block editor (Phase 4)
- Public profile page (Phase 3)
- Contact form (Phase 5)
- QR code download (Phase 5) — the landing page references QR codes conceptually but no generation logic is built yet
