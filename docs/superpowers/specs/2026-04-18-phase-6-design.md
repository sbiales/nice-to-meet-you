# Phase 6: Contact Form + QR Code — Design Spec

## Overview

Two independent features:
1. **Contact form** — a persistent form at the bottom of public profile pages that lets visitors message the profile owner without exposing their email.
2. **QR code page** — a dashboard page where users can generate and download a QR code pointing to their public profile URL.

## Contact Form

### Public profile changes

- Remove the existing filter that strips `contact_button` blocks from the rendered block list.
- Update `ContactButtonBlock.vue` to render as an anchor link scrolling to `#contact` (the contact form section at the bottom of the page). Useful as a "jump to contact" shortcut — a user could place this block near the top of their profile.
- Add a `ContactForm.vue` component rendered at the bottom of `[username].vue`, inside `<section id="contact">`.
- The contact form is shown **only** when `profile.status === 'active'` AND `profile.isContactable === true`. Paused and taken profiles do not show it.

### Contact form fields

| Field | Required | Notes |
|---|---|---|
| Name | Yes | |
| Email | No | Hint: "Required if you want a reply" |
| Message | Yes | Textarea |

On successful submission, the form is replaced with a thank-you message. Inline error messages for validation failures or server errors.

### API endpoint: `POST /api/profiles/[username]/contact`

**Rate limiting:** In-memory `Map<string, number[]>` keyed by client IP. Max 3 submissions per 10-minute window. Returns 429 if exceeded. Checked before any DB work.

**Validation:** Name, message required and non-empty. Email optional but validated as a valid email format if provided.

**Logic:**
1. Check rate limit — 429 if exceeded.
2. Validate inputs — 400 if invalid.
3. Fetch profile by username — 404 if not found or soft-deleted.
4. Check `profile.status === 'active'` and `profile.isContactable === true` — 403 otherwise.
5. Insert into `contact_messages` table.
6. Fetch owner's email from `user` table via `profile.userId`.
7. Send email via `sendEmail`: subject `"New message from [name] on Nice To Meet You"`, HTML body includes name, email (if provided), and message. Owner can reply directly to the sender.
8. Return 200.

### Testing

Vitest unit tests covering:
- Rate limit enforcement (4th request within window returns 429)
- Missing required fields return 400
- Unknown username returns 404
- Paused/taken profile returns 403
- Non-contactable profile returns 403
- Valid submission inserts into `contact_messages`

## QR Code Page

### Route

`/dashboard/qr` — CSR only (`ssr: false`), requires auth middleware.

### Dashboard nav

Add "Generate QR" link to the dashboard header to the left of the existing "Settings" link.

### Page behavior

- Fetches the user's username via `useProfile` (already loads profile data).
- Client-side renders a QR code onto a `<canvas>` element using the `qrcode` npm package.
- QR encodes: `https://nicetomeetyou.app/[username]`
- QR options: 300×300px, error correction level M.
- Displays the profile URL as text below the QR for reference.
- "Download PNG" button: calls `canvas.toDataURL('image/png')`, creates a temporary `<a>` element, triggers download as `nicetomeetyou-[username].png`.

### Dependencies

- `qrcode` npm package (not yet installed — add during implementation).
- `@types/qrcode` for TypeScript types.

## Schema / Migrations

No new tables or migrations needed. `contact_messages` already exists and matches the required shape.

## Out of Scope (future phases)

- `is_contactable` toggle in profile settings UI (currently hardwired to `true` default).
- QR code shop / print-on-demand ordering.
- In-app inbox for reading contact messages.
