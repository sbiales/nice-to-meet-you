# Phase 4: Profile Editor — Design Spec

**Date:** 2026-03-28
**Status:** Approved (design Q&A complete, ready for planning)

---

## Overview

Phase 4 is the core product — the authenticated dashboard where users build their profile using a block-based editor with a Canva-style theme sidebar.

The public profile page (`/:username`) is Phase 5. It reuses Phase 4's block components but is kept as a separate phase for focused review.

Phase 3 was a design Q&A session (this doc is its output). No code was written in Phase 3.

---

## Block System

### Architecture

Blocks are stored as a `blocks: jsonb` array on the `profiles` table. Each entry is `{ type, data }`. The renderer and editor both operate on this array. Adding a new block type = new TS type + new Vue component, no migration needed.

### Block width

Each block has a `width` property: `"full"` (default) or `"half"`. Half-width blocks pair up side-by-side on desktop and stack on mobile. This is the only layout control — no drag-resize grid. Stored as part of the block object in the JSONB array.

### Block catalog

| Block type | Repeatable | Description |
|---|---|---|
| `bio` | no | Rich text paragraph |
| `looking_for` | no | Freeform text — dating, friends, networking, etc. |
| `interests` | no | Tag/chip list |
| `pronouns` | no | Simple badge (she/her, they/them, etc.) |
| `location` | no | City or neighborhood — not precise |
| `currently` | no | "What I'm into right now" — book, show, project, obsession |
| `quote` | no | Favorite quote + attribution |
| `values` | no | Personal values chip list (like interests but distinct) |
| `photo_single` | yes | One photo + optional caption |
| `photo_carousel` | yes | Multiple photos, swipeable |
| `video` | no | YouTube or Vimeo embed |
| `website_preview` | no | Rich link preview card (title, description, favicon, URL) |
| `social_links` | no | Platform links (Instagram, Spotify, LinkedIn, Twitter/X, TikTok, YouTube, other) |
| `contact_button` | no | Triggers the contact form |

**Excluded for v1:** `spotify_embed`, `question_prompt`, `fun_facts`, `link_button`, `gif`

### Block repeatability rules

- `photo_single` and `photo_carousel` are freely repeatable.
- All other blocks are single-instance (UI prevents adding a second one).
- The system architecture allows any block type to be repeated — the single-instance restriction is a UI-layer rule, not a data-layer rule. This makes it easy to unlock in the future.

---

## Editor UX

### Layout

Dashboard is a CSR-only page (`/dashboard/**`, `ssr: false`). The editor is the main view.

### Adding blocks

A prominent "+ Add block" button opens a block picker modal or drawer. The picker:
- Shows all available block types with an icon and short description
- Greys out / hides block types the user has already added (for single-instance types)
- Freely lists repeatable types regardless

### Reordering

Drag and drop. Blocks are draggable within the column. The width toggle (full/half) is a per-block setting, not drag-based.

### Editing blocks

**Popup per block** — clicking a block opens a centered modal (desktop) or bottom sheet (mobile) containing that block's edit form. The canvas is visible behind it and previews changes live as the user types/edits. Consistent editing surface regardless of block complexity.

Each block popup contains:
- All editable fields for that block type
- A **full/half width toggle** for layout
- A **"Delete block" button** (destructive, at the bottom of the popup, with a confirmation step)

Closing the popup (save/done or dismiss) returns focus to the canvas.

### Theme editing

**Sidebar panel** — a Canva-style right sidebar for theme settings. Separate from block editing. Opening the theme panel does not interfere with block popups.

---

## Theme System

### Structure

Theme is stored as `theme: jsonb` on the `profiles` table. It contains:

```ts
{
  preset: string,          // name of the base preset, or "custom"
  backgroundColor: string, // hex
  surfaceColor: string,    // hex — block card backgrounds
  textColor: string,       // hex — primary text
  accentColor: string,     // hex — buttons, links, highlights
  headingFont: string,     // Google Fonts family name
  bodyFont: string,        // Google Fonts family name
  borderRadius: 'sharp' | 'soft' | 'round',
  shadow: 'flat' | 'lifted'
}
```

### Presets (6 vibes)

| Name | Vibe | Background | Surface | Text | Accent | Heading font | Body font | Radius | Shadow |
|---|---|---|---|---|---|---|---|---|---|
| **Sage & Linen** | Earthy, calm | Warm cream | White | Near-black | Dusty sage | DM Sans | DM Sans | soft | lifted |
| **Midnight** | Dark, mysterious | Deep navy/charcoal | Darker surface | White | Electric violet | Geometric sans | Geometric sans | sharp | flat |
| **Blossom** | Romantic, soft | Blush pink | Ivory | Warm dark | Dusty rose | Rounded serif | Rounded serif | round | lifted |
| **Bold** | Graphic, high-contrast | Pure black | Near-black | White | Punchy red or lime | Heavy sans | Heavy sans | sharp | flat |
| **Golden Hour** | Warm, 70s, nostalgic | Amber/cream | Warm white | Brown | Rust | Wide serif | Wide serif | soft | lifted |
| **Paper** | Minimal, clean, professional | Off-white | White | Near-black | Neutral grey | Book serif | Mono | sharp | flat |

### Theme editor sidebar

- Preset picker at the top — 6 swatches, click to apply
- Below the presets: per-property overrides
  - Color pickers for background, surface, text, accent
  - Font family dropdowns (Google Fonts, curated list)
  - Border radius selector (sharp / soft / round toggle)
  - Shadow selector (flat / lifted toggle)
- Changes preview live on the profile behind the sidebar
- "Reset to preset" button per section

---

## Out of Scope for Phase 4

- Public profile page `/:username` — Phase 5 (reuses Phase 4 block components)
- Contact form submission and email routing — Phase 6
- QR code generation and download — Phase 6
- Header/banner image upload (deferred — stretch goal for Phase 4 or Phase 5)
- Report page flow (post-v1 or stretch)
- In-app inbox (v2)
- Custom domains (v2)
