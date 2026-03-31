# Phase 4a: Profile Editor — Foundation + Text Blocks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional dashboard profile editor: block infrastructure (add, reorder, delete, edit popup), all 8 text-based block types, theme preset picker with live preview, and debounced auto-save.

**Architecture:** Shared TypeScript types (`app/types/`) define all block data shapes and theme. A `PATCH /api/profiles/me` endpoint persists the blocks array and theme object. The `useProfile` composable manages local state with 1.5s debounced auto-save. The dashboard renders a `BlockCanvas` (drag-to-reorder via vue-draggable-plus) where clicking a block opens a `BlockPopup` (modal on desktop, bottom sheet on mobile) containing the block's edit form. Theme is edited in a `ThemeSidebar` that applies CSS custom properties to the canvas wrapper div for live preview. Media/complex blocks (photo, video, social links, etc.) ship as stubs in this plan — fully implemented in Plan 4b.

**Tech stack:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Tiptap v2 (rich text), vue-draggable-plus (drag-drop), uuid

**Note on component naming:** `nuxt.config.ts` sets `pathPrefix: false` — all components auto-register by filename only regardless of subdirectory. `app/components/blocks/display/BioBlock.vue` → `<BioBlock />`. Use this in all templates.

**Note on Plan 4b:** After this plan is reviewed, Plan 4b implements: `photo_single`, `photo_carousel`, `video`, `website_preview`, `social_links`, `contact_button`, and the full theme custom editor (color pickers, font dropdowns).

---

## File Map

**New files:**
- `app/types/blocks.ts` — All block interfaces, BlockType union, BLOCK_META registry
- `app/types/theme.ts` — Theme interface, 6 preset definitions, `applyTheme()` utility
- `app/composables/useProfile.ts` — Profile fetch, block/theme state, auto-save
- `app/components/ui/TagInput.vue` — Reusable chip tag input (used by Interests, Values)
- `app/components/editor/BlockRenderer.vue` — Maps block type → display component via v-if
- `app/components/editor/BlockEditor.vue` — Maps block type → edit form component via v-if
- `app/components/editor/BlockCanvas.vue` — Drag-sortable list of block cards
- `app/components/editor/BlockCard.vue` — Wrapper card on canvas; click opens edit popup
- `app/components/editor/BlockPicker.vue` — Modal for choosing a new block type to add
- `app/components/editor/BlockPopup.vue` — Modal/bottom-sheet wrapper: edit slot + width toggle + delete
- `app/components/editor/ThemeSidebar.vue` — 6 preset swatches; live preview via CSS vars
- `app/components/blocks/display/BioBlock.vue`
- `app/components/blocks/display/LookingForBlock.vue`
- `app/components/blocks/display/InterestsBlock.vue`
- `app/components/blocks/display/ValuesBlock.vue`
- `app/components/blocks/display/PronounsBlock.vue`
- `app/components/blocks/display/LocationBlock.vue`
- `app/components/blocks/display/CurrentlyBlock.vue`
- `app/components/blocks/display/QuoteBlock.vue`
- `app/components/blocks/display/PhotoSingleBlock.vue` ← stub
- `app/components/blocks/display/PhotoCarouselBlock.vue` ← stub
- `app/components/blocks/display/VideoBlock.vue` ← stub
- `app/components/blocks/display/WebsitePreviewBlock.vue` ← stub
- `app/components/blocks/display/SocialLinksBlock.vue` ← stub
- `app/components/blocks/display/ContactButtonBlock.vue` ← stub
- `app/components/blocks/edit/BioBlockEdit.vue`
- `app/components/blocks/edit/LookingForBlockEdit.vue`
- `app/components/blocks/edit/InterestsBlockEdit.vue`
- `app/components/blocks/edit/ValuesBlockEdit.vue`
- `app/components/blocks/edit/PronounsBlockEdit.vue`
- `app/components/blocks/edit/LocationBlockEdit.vue`
- `app/components/blocks/edit/CurrentlyBlockEdit.vue`
- `app/components/blocks/edit/QuoteBlockEdit.vue`
- `app/components/blocks/edit/PhotoSingleBlockEdit.vue` ← stub
- `app/components/blocks/edit/PhotoCarouselBlockEdit.vue` ← stub
- `app/components/blocks/edit/VideoBlockEdit.vue` ← stub
- `app/components/blocks/edit/WebsitePreviewBlockEdit.vue` ← stub
- `app/components/blocks/edit/SocialLinksBlockEdit.vue` ← stub
- `app/components/blocks/edit/ContactButtonBlockEdit.vue` ← stub
- `server/api/profiles/me.patch.ts` — PATCH /api/profiles/me
- `__tests__/api/profiles/me-patch.test.ts` — Integration test

**Modified files:**
- `app/pages/dashboard/index.vue` — Full editor page
- `app/layouts/dashboard.vue` — Nav with save status indicator
- `nuxt.config.ts` — Add Google Fonts for theme presets
- `package.json` — New deps (tiptap, vue-draggable-plus, uuid)

---

## Tasks

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link vue-draggable-plus uuid --legacy-peer-deps
npm install --save-dev @types/uuid --legacy-peer-deps
```

Expected: packages appear in `node_modules`, no install errors.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tiptap, vue-draggable-plus, and uuid dependencies"
```

---

### Task 2: Define block TypeScript types

**Files:**
- Create: `app/types/blocks.ts`

- [ ] **Step 1: Create the file**

```ts
// app/types/blocks.ts

export type BlockWidth = 'full' | 'half'

export type BlockType =
  | 'bio'
  | 'looking_for'
  | 'interests'
  | 'values'
  | 'pronouns'
  | 'location'
  | 'currently'
  | 'quote'
  | 'photo_single'
  | 'photo_carousel'
  | 'video'
  | 'website_preview'
  | 'social_links'
  | 'contact_button'

// Block types where only one instance is allowed per profile (UI-layer rule only)
export const SINGLE_INSTANCE_BLOCKS: BlockType[] = [
  'bio',
  'looking_for',
  'interests',
  'values',
  'pronouns',
  'location',
  'currently',
  'quote',
  'video',
  'website_preview',
  'social_links',
  'contact_button',
]

export interface BioBlockData {
  content: string // HTML string from Tiptap
}

export interface LookingForBlockData {
  text: string
}

export interface InterestsBlockData {
  tags: string[]
}

export interface ValuesBlockData {
  tags: string[]
}

export interface PronounsBlockData {
  value: string // e.g. "she/her", "they/them", or custom
}

export interface LocationBlockData {
  text: string // e.g. "Brooklyn, NY"
}

export interface CurrentlyBlockData {
  label: string // e.g. "Reading", "Watching", "Into"
  value: string // e.g. "Dune"
}

export interface QuoteBlockData {
  text: string
  attribution: string
}

export interface PhotoSingleBlockData {
  photoId: string
  storageKey: string
  caption: string
}

export interface PhotoCarouselBlockData {
  photoIds: string[]
}

export interface VideoBlockData {
  url: string   // YouTube or Vimeo URL
  title: string
}

export interface WebsitePreviewBlockData {
  url: string
  title: string
  description: string
  imageUrl: string
}

export type SocialPlatform =
  | 'instagram'
  | 'spotify'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'website'
  | 'other'

export interface SocialLink {
  platform: SocialPlatform
  url: string
  label: string // custom label for 'website' or 'other'
}

export interface SocialLinksBlockData {
  links: SocialLink[]
}

export interface ContactButtonBlockData {
  label: string // e.g. "Get in touch"
}

export type BlockDataMap = {
  bio: BioBlockData
  looking_for: LookingForBlockData
  interests: InterestsBlockData
  values: ValuesBlockData
  pronouns: PronounsBlockData
  location: LocationBlockData
  currently: CurrentlyBlockData
  quote: QuoteBlockData
  photo_single: PhotoSingleBlockData
  photo_carousel: PhotoCarouselBlockData
  video: VideoBlockData
  website_preview: WebsitePreviewBlockData
  social_links: SocialLinksBlockData
  contact_button: ContactButtonBlockData
}

export interface Block<T extends BlockType = BlockType> {
  id: string        // UUID generated client-side when block is added
  type: T
  width: BlockWidth
  data: BlockDataMap[T]
}

// Use this when the block type is not known at compile time
export type AnyBlock = { [K in BlockType]: Block<K> }[BlockType]

export interface BlockMeta {
  type: BlockType
  label: string
  description: string
  icon: string
  defaultData: BlockDataMap[BlockType]
}

export const BLOCK_META: BlockMeta[] = [
  {
    type: 'bio',
    label: 'Bio',
    description: 'A rich text paragraph about you',
    icon: '✍️',
    defaultData: { content: '' } as BioBlockData,
  },
  {
    type: 'looking_for',
    label: 'Looking For',
    description: "What you're seeking — dating, friends, networking",
    icon: '🔍',
    defaultData: { text: '' } as LookingForBlockData,
  },
  {
    type: 'interests',
    label: 'Interests',
    description: "Things you're into, shown as chips",
    icon: '✨',
    defaultData: { tags: [] } as InterestsBlockData,
  },
  {
    type: 'values',
    label: 'Values',
    description: 'What matters to you',
    icon: '💛',
    defaultData: { tags: [] } as ValuesBlockData,
  },
  {
    type: 'pronouns',
    label: 'Pronouns',
    description: 'Your pronouns',
    icon: '🏷️',
    defaultData: { value: '' } as PronounsBlockData,
  },
  {
    type: 'location',
    label: 'Location',
    description: 'Your city or neighborhood',
    icon: '📍',
    defaultData: { text: '' } as LocationBlockData,
  },
  {
    type: 'currently',
    label: 'Currently',
    description: "What you're into right now",
    icon: '📖',
    defaultData: { label: 'Into', value: '' } as CurrentlyBlockData,
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'A quote that resonates with you',
    icon: '💬',
    defaultData: { text: '', attribution: '' } as QuoteBlockData,
  },
  {
    type: 'photo_single',
    label: 'Photo',
    description: 'A single photo with optional caption',
    icon: '🖼️',
    defaultData: { photoId: '', storageKey: '', caption: '' } as PhotoSingleBlockData,
  },
  {
    type: 'photo_carousel',
    label: 'Photo Carousel',
    description: 'Multiple photos in a swipeable carousel',
    icon: '🎠',
    defaultData: { photoIds: [] } as PhotoCarouselBlockData,
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A YouTube or Vimeo embed',
    icon: '▶️',
    defaultData: { url: '', title: '' } as VideoBlockData,
  },
  {
    type: 'website_preview',
    label: 'Website',
    description: 'A rich link preview card',
    icon: '🔗',
    defaultData: { url: '', title: '', description: '', imageUrl: '' } as WebsitePreviewBlockData,
  },
  {
    type: 'social_links',
    label: 'Social Links',
    description: 'Links to your social profiles',
    icon: '🌐',
    defaultData: { links: [] } as SocialLinksBlockData,
  },
  {
    type: 'contact_button',
    label: 'Contact Button',
    description: 'Let people reach out to you',
    icon: '📬',
    defaultData: { label: 'Get in touch' } as ContactButtonBlockData,
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/types/blocks.ts
git commit -m "feat: define block TypeScript types and BLOCK_META registry"
```

---

### Task 3: Define theme types and presets

**Files:**
- Create: `app/types/theme.ts`

- [ ] **Step 1: Create the file**

```ts
// app/types/theme.ts

export type BorderRadius = 'sharp' | 'soft' | 'round'
export type Shadow = 'flat' | 'lifted'
export type ThemePresetName =
  | 'sage-linen'
  | 'midnight'
  | 'blossom'
  | 'bold'
  | 'golden-hour'
  | 'paper'

export interface Theme {
  preset: ThemePresetName | 'custom'
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
  borderRadius: BorderRadius
  shadow: Shadow
}

export const THEME_PRESETS: Record<ThemePresetName, Omit<Theme, 'preset'>> = {
  'sage-linen': {
    backgroundColor: '#FAFAF8',
    surfaceColor: '#FFFFFF',
    textColor: '#1A1A17',
    mutedColor: '#6B6860',
    accentColor: '#6e8761',
    headingFont: 'DM Sans',
    bodyFont: 'DM Sans',
    borderRadius: 'soft',
    shadow: 'lifted',
  },
  'midnight': {
    backgroundColor: '#0f1117',
    surfaceColor: '#1a1d27',
    textColor: '#f0f0f5',
    mutedColor: '#8888aa',
    accentColor: '#7c6df5',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: 'sharp',
    shadow: 'flat',
  },
  'blossom': {
    backgroundColor: '#fdf0f3',
    surfaceColor: '#fff7f9',
    textColor: '#3a2028',
    mutedColor: '#9e7882',
    accentColor: '#c96d8a',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    borderRadius: 'round',
    shadow: 'lifted',
  },
  'bold': {
    backgroundColor: '#000000',
    surfaceColor: '#111111',
    textColor: '#ffffff',
    mutedColor: '#888888',
    accentColor: '#ff3b3b',
    headingFont: 'Bebas Neue',
    bodyFont: 'Inter',
    borderRadius: 'sharp',
    shadow: 'flat',
  },
  'golden-hour': {
    backgroundColor: '#fdf6e3',
    surfaceColor: '#fffaf0',
    textColor: '#3b2a14',
    mutedColor: '#8a6a3a',
    accentColor: '#c07c2a',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    borderRadius: 'soft',
    shadow: 'lifted',
  },
  'paper': {
    backgroundColor: '#f8f7f4',
    surfaceColor: '#ffffff',
    textColor: '#1c1c1c',
    mutedColor: '#888888',
    accentColor: '#444444',
    headingFont: 'Merriweather',
    bodyFont: 'IBM Plex Mono',
    borderRadius: 'sharp',
    shadow: 'flat',
  },
}

export const DEFAULT_THEME: Theme = {
  preset: 'sage-linen',
  ...THEME_PRESETS['sage-linen'],
}

const RADIUS_VALUES: Record<BorderRadius, string> = {
  sharp: '0px',
  soft: '10px',
  round: '20px',
}

const SHADOW_VALUES: Record<Shadow, string> = {
  flat: 'none',
  lifted: '0 2px 12px rgba(0,0,0,0.08)',
}

// Applies theme as CSS custom properties to a container element.
// Block components read these vars for colors/fonts/radius/shadow.
export function applyTheme(el: HTMLElement, theme: Theme): void {
  el.style.setProperty('--profile-bg', theme.backgroundColor)
  el.style.setProperty('--profile-surface', theme.surfaceColor)
  el.style.setProperty('--profile-text', theme.textColor)
  el.style.setProperty('--profile-muted', theme.mutedColor)
  el.style.setProperty('--profile-accent', theme.accentColor)
  el.style.setProperty('--profile-heading-font', theme.headingFont)
  el.style.setProperty('--profile-body-font', theme.bodyFont)
  el.style.setProperty('--profile-radius', RADIUS_VALUES[theme.borderRadius])
  el.style.setProperty('--profile-shadow', SHADOW_VALUES[theme.shadow])
}
```

- [ ] **Step 2: Commit**

```bash
git add app/types/theme.ts
git commit -m "feat: define theme types, 6 presets, and applyTheme utility"
```

---

### Task 4: Write integration test for PATCH /api/profiles/me

**Files:**
- Create: `__tests__/api/profiles/me-patch.test.ts`

The test pattern in this codebase tests the DB layer directly via Drizzle (see `__tests__/db/schema.test.ts`). We follow the same approach and validate the HTTP handler separately through Playwright.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/api/profiles/me-patch.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../../../server/db'
import { profiles } from '../../../server/db/schema/profiles'
import { user } from '../../../server/db/schema/auth'
import type { AnyBlock } from '../../../app/types/blocks'
import type { Theme } from '../../../app/types/theme'

const TEST_USER_ID = 'patch-test-user-id'
const TEST_USERNAME = 'patch_test_user'

beforeAll(async () => {
  await db.insert(user).values({
    id: TEST_USER_ID,
    name: 'Patch Test',
    email: 'patchtest@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing()

  await db.insert(profiles).values({
    userId: TEST_USER_ID,
    username: TEST_USERNAME,
    displayName: 'Patch Test User',
  }).onConflictDoNothing()
})

afterAll(async () => {
  await db.delete(profiles).where(eq(profiles.userId, TEST_USER_ID))
  await db.delete(user).where(eq(user.id, TEST_USER_ID))
})

describe('profile blocks and theme persistence', () => {
  it('persists a blocks array', async () => {
    const blocks: AnyBlock[] = [
      {
        id: 'test-block-1',
        type: 'bio',
        width: 'full',
        data: { content: '<p>Hello world</p>' },
      },
      {
        id: 'test-block-2',
        type: 'interests',
        width: 'half',
        data: { tags: ['hiking', 'coffee'] },
      },
    ]

    await db.update(profiles)
      .set({ blocks: blocks as any, updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })

    expect(row?.blocks).toEqual(blocks)
  })

  it('persists a theme object', async () => {
    const theme: Partial<Theme> = {
      preset: 'midnight',
      backgroundColor: '#0f1117',
      accentColor: '#7c6df5',
    }

    await db.update(profiles)
      .set({ theme: theme as any, updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })

    expect((row?.theme as any)?.preset).toBe('midnight')
    expect((row?.theme as any)?.accentColor).toBe('#7c6df5')
  })

  it('blocks array preserves order', async () => {
    const blocks: AnyBlock[] = [
      { id: 'b1', type: 'bio', width: 'full', data: { content: 'first' } },
      { id: 'b2', type: 'location', width: 'full', data: { text: 'NYC' } },
      { id: 'b3', type: 'pronouns', width: 'half', data: { value: 'she/her' } },
    ]

    await db.update(profiles)
      .set({ blocks: blocks as any, updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })

    const saved = row?.blocks as AnyBlock[]
    expect(saved[0].id).toBe('b1')
    expect(saved[1].id).toBe('b2')
    expect(saved[2].id).toBe('b3')
  })
})
```

- [ ] **Step 2: Run the tests to confirm they pass (DB layer is working)**

```bash
npm test -- __tests__/api/profiles/me-patch.test.ts
```

Expected: all 3 tests PASS. These validate the DB layer before we wire the HTTP handler.

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/profiles/me-patch.test.ts
git commit -m "test: add integration tests for profile blocks/theme persistence"
```

---

### Task 5: Implement PATCH /api/profiles/me

**Files:**
- Create: `server/api/profiles/me.patch.ts`

- [ ] **Step 1: Implement the handler**

```ts
// server/api/profiles/me.patch.ts
import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body?.blocks !== undefined) {
    if (!Array.isArray(body.blocks)) {
      throw createError({ statusCode: 400, message: 'blocks must be an array' })
    }
    updates.blocks = body.blocks
  }

  if (body?.theme !== undefined) {
    if (typeof body.theme !== 'object' || body.theme === null) {
      throw createError({ statusCode: 400, message: 'theme must be an object' })
    }
    updates.theme = body.theme
  }

  const [updated] = await db.update(profiles)
    .set(updates)
    .where(eq(profiles.userId, session.user.id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  return updated
})
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add server/api/profiles/me.patch.ts
git commit -m "feat: add PATCH /api/profiles/me endpoint for blocks and theme"
```

---

### Task 6: useProfile composable

**Files:**
- Create: `app/composables/useProfile.ts`

- [ ] **Step 1: Create the composable**

```ts
// app/composables/useProfile.ts
import { v4 as uuid } from 'uuid'
import type { AnyBlock, BlockType } from '~/types/blocks'
import type { Theme } from '~/types/theme'
import { DEFAULT_THEME } from '~/types/theme'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useProfile() {
  const profile = ref<Record<string, unknown> | null>(null)
  const blocks = ref<AnyBlock[]>([])
  const theme = ref<Theme>({ ...DEFAULT_THEME })
  const saveStatus = ref<SaveStatus>('idle')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function loadProfile() {
    const data = await $fetch<Record<string, unknown>>('/api/profiles/me')
    profile.value = data
    blocks.value = Array.isArray(data.blocks) ? (data.blocks as AnyBlock[]) : []
    theme.value = data.theme && Object.keys(data.theme as object).length
      ? (data.theme as Theme)
      : { ...DEFAULT_THEME }
  }

  async function save() {
    saveStatus.value = 'saving'
    try {
      await $fetch('/api/profiles/me', {
        method: 'PATCH',
        body: { blocks: blocks.value, theme: theme.value },
      })
      saveStatus.value = 'saved'
      setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle'
      }, 2000)
    } catch {
      saveStatus.value = 'error'
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 1500)
  }

  // Auto-save whenever blocks or theme change
  watch(blocks, scheduleSave, { deep: true })
  watch(theme, scheduleSave, { deep: true })

  function addBlock(block: AnyBlock) {
    blocks.value = [...blocks.value, block]
  }

  function updateBlockData(id: string, data: AnyBlock['data']) {
    blocks.value = blocks.value.map(b =>
      b.id === id ? { ...b, data } : b
    )
  }

  function updateBlockWidth(id: string, width: 'full' | 'half') {
    blocks.value = blocks.value.map(b =>
      b.id === id ? { ...b, width } : b
    )
  }

  function removeBlock(id: string) {
    blocks.value = blocks.value.filter(b => b.id !== id)
  }

  function reorderBlocks(newOrder: AnyBlock[]) {
    blocks.value = newOrder
  }

  function setTheme(t: Theme) {
    theme.value = t
  }

  function existingBlockTypes(): BlockType[] {
    return blocks.value.map(b => b.type)
  }

  function newBlockId(): string {
    return uuid()
  }

  return {
    profile,
    blocks,
    theme,
    saveStatus,
    loadProfile,
    addBlock,
    updateBlockData,
    updateBlockWidth,
    removeBlock,
    reorderBlocks,
    setTheme,
    existingBlockTypes,
    newBlockId,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useProfile.ts
git commit -m "feat: add useProfile composable with auto-save"
```

---

### Task 7: TagInput UI component

**Files:**
- Create: `app/components/ui/TagInput.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/ui/TagInput.vue -->
<script setup lang="ts">
interface Props {
  modelValue: string[]
  label?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type and press Enter',
})
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const inputValue = ref('')

function addTag() {
  const tag = inputValue.value.trim()
  if (tag && !props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
  inputValue.value = ''
}

function removeTag(tag: string) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && !inputValue.value && props.modelValue.length) {
    removeTag(props.modelValue[props.modelValue.length - 1])
  }
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-warm-text">
      {{ label }}
    </label>
    <div
      class="flex min-h-[44px] flex-wrap gap-1.5 rounded-md border border-warm-border bg-warm-card px-3 py-2 focus-within:ring-2 focus-within:ring-sage-500 focus-within:ring-offset-2"
    >
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-0.5 text-sm text-sage-800"
      >
        {{ tag }}
        <button
          type="button"
          class="leading-none text-sage-500 hover:text-sage-900"
          @click="removeTag(tag)"
        >×</button>
      </span>
      <input
        v-model="inputValue"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        class="min-w-[120px] flex-1 bg-transparent text-sm text-warm-text outline-none placeholder:text-warm-muted"
        @keydown="handleKeydown"
        @blur="addTag"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ui/TagInput.vue
git commit -m "feat: add TagInput component"
```

---

### Task 8: BlockPopup

**Files:**
- Create: `app/components/editor/BlockPopup.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/editor/BlockPopup.vue -->
<script setup lang="ts">
interface Props {
  title: string
  width: 'full' | 'half'
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
  'update:width': [value: 'full' | 'half']
  delete: []
}>()

const confirmingDelete = ref(false)

function handleDelete() {
  if (confirmingDelete.value) {
    emit('delete')
    emit('close')
  } else {
    confirmingDelete.value = true
  }
}

function handleClose() {
  confirmingDelete.value = false
  emit('close')
}

onMounted(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose()
  }
  document.addEventListener('keydown', onKey)
  onUnmounted(() => document.removeEventListener('keydown', onKey))
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      @click.self="handleClose"
    />
    <!-- Panel: bottom sheet on mobile, centered modal on sm+ -->
    <div
      class="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-warm-card shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <!-- Header -->
      <div class="flex shrink-0 items-center justify-between border-b border-warm-border px-5 py-4">
        <h2 class="text-base font-semibold text-warm-text">{{ title }}</h2>
        <button
          class="text-warm-muted transition-colors hover:text-warm-text"
          @click="handleClose"
        >✕</button>
      </div>

      <!-- Block-specific edit form -->
      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <slot />
      </div>

      <!-- Footer: width toggle + delete -->
      <div class="shrink-0 border-t border-warm-border px-5 py-3">
        <div class="mb-3 flex items-center gap-2">
          <span class="text-xs text-warm-muted">Width:</span>
          <button
            :class="[
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              width === 'full'
                ? 'bg-sage-500 text-white'
                : 'border border-warm-border text-warm-muted hover:bg-warm-bg',
            ]"
            @click="emit('update:width', 'full')"
          >Full</button>
          <button
            :class="[
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              width === 'half'
                ? 'bg-sage-500 text-white'
                : 'border border-warm-border text-warm-muted hover:bg-warm-bg',
            ]"
            @click="emit('update:width', 'half')"
          >Half</button>
        </div>

        <button
          v-if="!confirmingDelete"
          class="w-full rounded-md py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
          @click="handleDelete"
        >Delete block</button>
        <div v-else class="flex gap-2">
          <button
            class="flex-1 rounded-md py-2 text-sm text-warm-muted transition-colors hover:bg-warm-bg"
            @click="confirmingDelete = false"
          >Cancel</button>
          <button
            class="flex-1 rounded-md bg-red-500 py-2 text-sm text-white transition-colors hover:bg-red-600"
            @click="handleDelete"
          >Yes, delete</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/editor/BlockPopup.vue
git commit -m "feat: add BlockPopup base component with width toggle and delete"
```

---

### Task 9: BlockPicker

**Files:**
- Create: `app/components/editor/BlockPicker.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/editor/BlockPicker.vue -->
<script setup lang="ts">
import { BLOCK_META, SINGLE_INSTANCE_BLOCKS, type BlockMeta, type BlockType } from '~/types/blocks'

interface Props {
  existingBlockTypes: BlockType[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [meta: BlockMeta]
  close: []
}>()

function isDisabled(type: BlockType): boolean {
  return SINGLE_INSTANCE_BLOCKS.includes(type) && props.existingBlockTypes.includes(type)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      @click.self="emit('close')"
    />
    <div
      class="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-warm-card shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <div class="flex items-center justify-between border-b border-warm-border px-5 py-4">
        <h2 class="text-base font-semibold text-warm-text">Add a block</h2>
        <button class="text-warm-muted hover:text-warm-text" @click="emit('close')">✕</button>
      </div>
      <div class="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        <button
          v-for="meta in BLOCK_META"
          :key="meta.type"
          :disabled="isDisabled(meta.type)"
          class="flex items-start gap-3 rounded-xl border border-warm-border p-3 text-left transition-colors hover:border-sage-300 hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-40"
          @click="!isDisabled(meta.type) && emit('select', meta)"
        >
          <span class="mt-0.5 text-xl leading-none">{{ meta.icon }}</span>
          <div>
            <div class="text-sm font-medium text-warm-text">{{ meta.label }}</div>
            <div class="mt-0.5 text-xs text-warm-muted">{{ meta.description }}</div>
          </div>
        </button>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/editor/BlockPicker.vue
git commit -m "feat: add BlockPicker modal"
```

---

### Task 10: BlockCard and BlockCanvas

**Files:**
- Create: `app/components/editor/BlockCard.vue`
- Create: `app/components/editor/BlockCanvas.vue`

- [ ] **Step 1: Create BlockCard**

```vue
<!-- app/components/editor/BlockCard.vue -->
<script setup lang="ts">
import type { AnyBlock } from '~/types/blocks'
defineProps<{ block: AnyBlock }>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <div
    class="group relative cursor-pointer rounded-[var(--profile-radius,10px)] border-2 border-transparent bg-[var(--profile-surface,#fff)] p-4 shadow-[var(--profile-shadow,none)] transition-all hover:border-sage-200"
    @click="emit('click')"
  >
    <!-- Drag handle — visible on hover -->
    <div
      class="drag-handle absolute left-1.5 top-1/2 -translate-y-1/2 cursor-grab select-none text-warm-muted opacity-0 group-hover:opacity-100"
      title="Drag to reorder"
    >⠿</div>
    <slot />
  </div>
</template>
```

- [ ] **Step 2: Create BlockCanvas**

```vue
<!-- app/components/editor/BlockCanvas.vue -->
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { AnyBlock } from '~/types/blocks'

const props = defineProps<{ blocks: AnyBlock[] }>()
const emit = defineEmits<{
  'update:blocks': [blocks: AnyBlock[]]
  'edit-block': [id: string]
}>()

const localBlocks = computed({
  get: () => props.blocks,
  set: (val) => emit('update:blocks', val),
})
</script>

<template>
  <VueDraggable
    v-model="localBlocks"
    handle=".drag-handle"
    :animation="200"
    class="flex flex-wrap gap-3"
  >
    <div
      v-for="block in localBlocks"
      :key="block.id"
      :class="block.width === 'half' ? 'w-[calc(50%-6px)]' : 'w-full'"
    >
      <BlockCard :block="block" @click="emit('edit-block', block.id)">
        <BlockRenderer :block="block" />
      </BlockCard>
    </div>
  </VueDraggable>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/editor/BlockCard.vue app/components/editor/BlockCanvas.vue
git commit -m "feat: add BlockCard and BlockCanvas with drag-to-reorder"
```

---

### Task 11: BlockRenderer and BlockEditor dispatcher components

These two components map block types to their display/edit Vue components using explicit v-if chains. No dynamic string resolution — all components are auto-imported by Nuxt.

**Files:**
- Create: `app/components/editor/BlockRenderer.vue`
- Create: `app/components/editor/BlockEditor.vue`

- [ ] **Step 1: Create BlockRenderer (display dispatcher)**

```vue
<!-- app/components/editor/BlockRenderer.vue -->
<script setup lang="ts">
import type { AnyBlock } from '~/types/blocks'
defineProps<{ block: AnyBlock }>()
</script>

<template>
  <BioBlock v-if="block.type === 'bio'" :data="(block.data as any)" />
  <LookingForBlock v-else-if="block.type === 'looking_for'" :data="(block.data as any)" />
  <InterestsBlock v-else-if="block.type === 'interests'" :data="(block.data as any)" />
  <ValuesBlock v-else-if="block.type === 'values'" :data="(block.data as any)" />
  <PronounsBlock v-else-if="block.type === 'pronouns'" :data="(block.data as any)" />
  <LocationBlock v-else-if="block.type === 'location'" :data="(block.data as any)" />
  <CurrentlyBlock v-else-if="block.type === 'currently'" :data="(block.data as any)" />
  <QuoteBlock v-else-if="block.type === 'quote'" :data="(block.data as any)" />
  <PhotoSingleBlock v-else-if="block.type === 'photo_single'" :data="(block.data as any)" />
  <PhotoCarouselBlock v-else-if="block.type === 'photo_carousel'" :data="(block.data as any)" />
  <VideoBlock v-else-if="block.type === 'video'" :data="(block.data as any)" />
  <WebsitePreviewBlock v-else-if="block.type === 'website_preview'" :data="(block.data as any)" />
  <SocialLinksBlock v-else-if="block.type === 'social_links'" :data="(block.data as any)" />
  <ContactButtonBlock v-else-if="block.type === 'contact_button'" :data="(block.data as any)" />
</template>
```

- [ ] **Step 2: Create BlockEditor (edit form dispatcher)**

```vue
<!-- app/components/editor/BlockEditor.vue -->
<script setup lang="ts">
import type { AnyBlock } from '~/types/blocks'

const props = defineProps<{ block: AnyBlock }>()
const emit = defineEmits<{ 'update:data': [data: AnyBlock['data']] }>()
</script>

<template>
  <BioBlockEdit
    v-if="props.block.type === 'bio'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <LookingForBlockEdit
    v-else-if="props.block.type === 'looking_for'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <InterestsBlockEdit
    v-else-if="props.block.type === 'interests'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <ValuesBlockEdit
    v-else-if="props.block.type === 'values'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <PronounsBlockEdit
    v-else-if="props.block.type === 'pronouns'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <LocationBlockEdit
    v-else-if="props.block.type === 'location'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <CurrentlyBlockEdit
    v-else-if="props.block.type === 'currently'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <QuoteBlockEdit
    v-else-if="props.block.type === 'quote'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <PhotoSingleBlockEdit
    v-else-if="props.block.type === 'photo_single'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <PhotoCarouselBlockEdit
    v-else-if="props.block.type === 'photo_carousel'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <VideoBlockEdit
    v-else-if="props.block.type === 'video'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <WebsitePreviewBlockEdit
    v-else-if="props.block.type === 'website_preview'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <SocialLinksBlockEdit
    v-else-if="props.block.type === 'social_links'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <ContactButtonBlockEdit
    v-else-if="props.block.type === 'contact_button'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/editor/BlockRenderer.vue app/components/editor/BlockEditor.vue
git commit -m "feat: add BlockRenderer and BlockEditor dispatcher components"
```

---

### Task 12: Bio block (display + edit)

**Files:**
- Create: `app/components/blocks/display/BioBlock.vue`
- Create: `app/components/blocks/edit/BioBlockEdit.vue`

- [ ] **Step 1: Create the display component**

```vue
<!-- app/components/blocks/display/BioBlock.vue -->
<script setup lang="ts">
import type { BioBlockData } from '~/types/blocks'
defineProps<{ data: BioBlockData }>()
</script>

<template>
  <div
    v-if="data.content"
    class="prose prose-sm max-w-none text-[var(--profile-text,#1a1a17)] [&_a]:text-[var(--profile-accent,#6e8761)]"
    v-html="data.content"
  />
  <p v-else class="text-sm italic text-warm-muted">Write your bio…</p>
</template>
```

- [ ] **Step 2: Create the edit component**

```vue
<!-- app/components/blocks/edit/BioBlockEdit.vue -->
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { BioBlockData } from '~/types/blocks'

const props = defineProps<{ data: BioBlockData }>()
const emit = defineEmits<{ 'update:data': [data: BioBlockData] }>()

const editor = useEditor({
  content: props.data.content,
  extensions: [StarterKit, Link.configure({ openOnClick: false })],
  onUpdate({ editor }) {
    emit('update:data', { content: editor.getHTML() })
  },
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div>
    <!-- Minimal toolbar -->
    <div class="mb-2 flex gap-1 border-b border-warm-border pb-2">
      <button
        :class="['rounded px-2 py-1 text-xs font-bold transition-colors', editor?.isActive('bold') ? 'bg-sage-100 text-sage-800' : 'text-warm-muted hover:bg-warm-bg']"
        @click="editor?.chain().focus().toggleBold().run()"
      >B</button>
      <button
        :class="['rounded px-2 py-1 text-xs italic transition-colors', editor?.isActive('italic') ? 'bg-sage-100 text-sage-800' : 'text-warm-muted hover:bg-warm-bg']"
        @click="editor?.chain().focus().toggleItalic().run()"
      >I</button>
    </div>
    <!-- Tiptap editor area -->
    <EditorContent
      :editor="editor"
      class="min-h-[80px] text-sm text-warm-text [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none"
    />
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/blocks/display/BioBlock.vue app/components/blocks/edit/BioBlockEdit.vue
git commit -m "feat: add Bio block with Tiptap rich text editor"
```

---

### Task 13: LookingFor, Quote, Location, Currently, Pronouns blocks

**Files:**
- Create: `app/components/blocks/display/LookingForBlock.vue`
- Create: `app/components/blocks/edit/LookingForBlockEdit.vue`
- Create: `app/components/blocks/display/QuoteBlock.vue`
- Create: `app/components/blocks/edit/QuoteBlockEdit.vue`
- Create: `app/components/blocks/display/LocationBlock.vue`
- Create: `app/components/blocks/edit/LocationBlockEdit.vue`
- Create: `app/components/blocks/display/CurrentlyBlock.vue`
- Create: `app/components/blocks/edit/CurrentlyBlockEdit.vue`
- Create: `app/components/blocks/display/PronounsBlock.vue`
- Create: `app/components/blocks/edit/PronounsBlockEdit.vue`

- [ ] **Step 1: LookingFor block**

```vue
<!-- app/components/blocks/display/LookingForBlock.vue -->
<script setup lang="ts">
import type { LookingForBlockData } from '~/types/blocks'
defineProps<{ data: LookingForBlockData }>()
</script>
<template>
  <div>
    <div class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]">
      Looking for
    </div>
    <p v-if="data.text" class="text-sm text-[var(--profile-text,#1a1a17)]">{{ data.text }}</p>
    <p v-else class="text-sm italic text-warm-muted">What are you looking for?</p>
  </div>
</template>
```

```vue
<!-- app/components/blocks/edit/LookingForBlockEdit.vue -->
<script setup lang="ts">
import type { LookingForBlockData } from '~/types/blocks'
const props = defineProps<{ data: LookingForBlockData }>()
const emit = defineEmits<{ 'update:data': [data: LookingForBlockData] }>()
const text = ref(props.data.text)
watch(text, (v) => emit('update:data', { text: v }))
</script>
<template>
  <div>
    <label class="mb-1.5 block text-sm font-medium text-warm-text">
      What are you looking for?
    </label>
    <textarea
      v-model="text"
      rows="3"
      placeholder="e.g. New friends to explore the city with, or someone to grab coffee and talk about books"
      class="w-full resize-none rounded-md border border-warm-border bg-warm-bg px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted focus:outline-none focus:ring-2 focus:ring-sage-500"
    />
  </div>
</template>
```

- [ ] **Step 2: Quote block**

```vue
<!-- app/components/blocks/display/QuoteBlock.vue -->
<script setup lang="ts">
import type { QuoteBlockData } from '~/types/blocks'
defineProps<{ data: QuoteBlockData }>()
</script>
<template>
  <blockquote class="border-l-4 border-[var(--profile-accent,#6e8761)] pl-4">
    <p v-if="data.text" class="text-sm italic text-[var(--profile-text,#1a1a17)]">
      "{{ data.text }}"
    </p>
    <p v-else class="text-sm italic text-warm-muted">Your favorite quote…</p>
    <footer v-if="data.attribution" class="mt-1 text-xs text-[var(--profile-muted,#6b6860)]">
      — {{ data.attribution }}
    </footer>
  </blockquote>
</template>
```

```vue
<!-- app/components/blocks/edit/QuoteBlockEdit.vue -->
<script setup lang="ts">
import type { QuoteBlockData } from '~/types/blocks'
const props = defineProps<{ data: QuoteBlockData }>()
const emit = defineEmits<{ 'update:data': [data: QuoteBlockData] }>()
const local = reactive({ ...props.data })
watch(local, (v) => emit('update:data', { text: v.text, attribution: v.attribution }), { deep: true })
</script>
<template>
  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-warm-text">Quote</label>
      <textarea
        v-model="local.text"
        rows="2"
        placeholder="A quote that resonates with you"
        class="w-full resize-none rounded-md border border-warm-border bg-warm-bg px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted focus:outline-none focus:ring-2 focus:ring-sage-500"
      />
    </div>
    <AppInput v-model="local.attribution" label="Attribution (optional)" placeholder="— Author name" />
  </div>
</template>
```

- [ ] **Step 3: Location block**

```vue
<!-- app/components/blocks/display/LocationBlock.vue -->
<script setup lang="ts">
import type { LocationBlockData } from '~/types/blocks'
defineProps<{ data: LocationBlockData }>()
</script>
<template>
  <div class="flex items-center gap-2 text-sm text-[var(--profile-text,#1a1a17)]">
    <span>📍</span>
    <span v-if="data.text">{{ data.text }}</span>
    <span v-else class="italic text-warm-muted">Your location</span>
  </div>
</template>
```

```vue
<!-- app/components/blocks/edit/LocationBlockEdit.vue -->
<script setup lang="ts">
import type { LocationBlockData } from '~/types/blocks'
const props = defineProps<{ data: LocationBlockData }>()
const emit = defineEmits<{ 'update:data': [data: LocationBlockData] }>()
const text = ref(props.data.text)
watch(text, (v) => emit('update:data', { text: v }))
</script>
<template>
  <AppInput v-model="text" label="City or neighborhood" placeholder="Brooklyn, NY" />
</template>
```

- [ ] **Step 4: Currently block**

```vue
<!-- app/components/blocks/display/CurrentlyBlock.vue -->
<script setup lang="ts">
import type { CurrentlyBlockData } from '~/types/blocks'
defineProps<{ data: CurrentlyBlockData }>()
</script>
<template>
  <div class="text-sm text-[var(--profile-text,#1a1a17)]">
    <span class="font-semibold">{{ data.label || 'Currently' }}:</span>
    <span v-if="data.value" class="ml-1.5">{{ data.value }}</span>
    <span v-else class="ml-1.5 italic text-warm-muted">Add something you're into right now</span>
  </div>
</template>
```

```vue
<!-- app/components/blocks/edit/CurrentlyBlockEdit.vue -->
<script setup lang="ts">
import type { CurrentlyBlockData } from '~/types/blocks'
const props = defineProps<{ data: CurrentlyBlockData }>()
const emit = defineEmits<{ 'update:data': [data: CurrentlyBlockData] }>()
const local = reactive({ ...props.data })
watch(local, (v) => emit('update:data', { label: v.label, value: v.value }), { deep: true })

const labelOptions = ['Reading', 'Watching', 'Listening to', 'Working on', 'Into', 'Obsessed with']
</script>
<template>
  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-warm-text">Label</label>
      <select
        v-model="local.label"
        class="w-full rounded-md border border-warm-border bg-warm-bg px-3 py-2 text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-sage-500"
      >
        <option v-for="opt in labelOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
    <AppInput v-model="local.value" label="What?" placeholder="e.g. Dune, The Bear, ambient music…" />
  </div>
</template>
```

- [ ] **Step 5: Pronouns block**

```vue
<!-- app/components/blocks/display/PronounsBlock.vue -->
<script setup lang="ts">
import type { PronounsBlockData } from '~/types/blocks'
defineProps<{ data: PronounsBlockData }>()
</script>
<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-full border border-[var(--profile-accent,#6e8761)] px-3 py-1 text-sm text-[var(--profile-accent,#6e8761)]"
  >
    <span>🏷️</span>
    <span v-if="data.value">{{ data.value }}</span>
    <span v-else class="italic text-warm-muted">Your pronouns</span>
  </div>
</template>
```

```vue
<!-- app/components/blocks/edit/PronounsBlockEdit.vue -->
<script setup lang="ts">
import type { PronounsBlockData } from '~/types/blocks'
const props = defineProps<{ data: PronounsBlockData }>()
const emit = defineEmits<{ 'update:data': [data: PronounsBlockData] }>()

const PRESET_OPTIONS = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'any/all']
const isPreset = (v: string) => PRESET_OPTIONS.includes(v)

const selected = ref(isPreset(props.data.value) ? props.data.value : 'custom')
const customValue = ref(isPreset(props.data.value) ? '' : props.data.value)

function selectOption(opt: string) {
  selected.value = opt
  if (opt !== 'custom') {
    emit('update:data', { value: opt })
  }
}

watch(customValue, (v) => {
  if (selected.value === 'custom') {
    emit('update:data', { value: v })
  }
})
</script>
<template>
  <div class="flex flex-col gap-3">
    <label class="text-sm font-medium text-warm-text">Pronouns</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in [...PRESET_OPTIONS, 'custom']"
        :key="opt"
        :class="[
          'rounded-full border px-3 py-1 text-sm transition-colors',
          selected === opt
            ? 'border-sage-500 bg-sage-50 text-sage-700'
            : 'border-warm-border text-warm-muted hover:border-sage-300',
        ]"
        @click="selectOption(opt)"
      >{{ opt }}</button>
    </div>
    <AppInput
      v-if="selected === 'custom'"
      v-model="customValue"
      placeholder="e.g. xe/xem"
      label="Custom pronouns"
    />
  </div>
</template>
```

- [ ] **Step 6: Commit all five blocks**

```bash
git add app/components/blocks/display/LookingForBlock.vue app/components/blocks/edit/LookingForBlockEdit.vue \
        app/components/blocks/display/QuoteBlock.vue app/components/blocks/edit/QuoteBlockEdit.vue \
        app/components/blocks/display/LocationBlock.vue app/components/blocks/edit/LocationBlockEdit.vue \
        app/components/blocks/display/CurrentlyBlock.vue app/components/blocks/edit/CurrentlyBlockEdit.vue \
        app/components/blocks/display/PronounsBlock.vue app/components/blocks/edit/PronounsBlockEdit.vue
git commit -m "feat: add LookingFor, Quote, Location, Currently, Pronouns block components"
```

---

### Task 14: Interests and Values blocks

**Files:**
- Create: `app/components/blocks/display/InterestsBlock.vue`
- Create: `app/components/blocks/edit/InterestsBlockEdit.vue`
- Create: `app/components/blocks/display/ValuesBlock.vue`
- Create: `app/components/blocks/edit/ValuesBlockEdit.vue`

- [ ] **Step 1: Interests block**

```vue
<!-- app/components/blocks/display/InterestsBlock.vue -->
<script setup lang="ts">
import type { InterestsBlockData } from '~/types/blocks'
defineProps<{ data: InterestsBlockData }>()
</script>
<template>
  <div>
    <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]">
      Interests
    </div>
    <div v-if="data.tags.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in data.tags"
        :key="tag"
        class="rounded-full bg-[var(--profile-surface,#fff)] px-3 py-1 text-sm text-[var(--profile-text,#1a1a17)] shadow-sm ring-1 ring-black/5"
      >{{ tag }}</span>
    </div>
    <p v-else class="text-sm italic text-warm-muted">Add your interests…</p>
  </div>
</template>
```

```vue
<!-- app/components/blocks/edit/InterestsBlockEdit.vue -->
<script setup lang="ts">
import type { InterestsBlockData } from '~/types/blocks'
const props = defineProps<{ data: InterestsBlockData }>()
const emit = defineEmits<{ 'update:data': [data: InterestsBlockData] }>()
const tags = ref([...props.data.tags])
watch(tags, (v) => emit('update:data', { tags: [...v] }), { deep: true })
</script>
<template>
  <TagInput v-model="tags" label="Interests" placeholder="Type an interest, press Enter" />
</template>
```

- [ ] **Step 2: Values block**

```vue
<!-- app/components/blocks/display/ValuesBlock.vue -->
<script setup lang="ts">
import type { ValuesBlockData } from '~/types/blocks'
defineProps<{ data: ValuesBlockData }>()
</script>
<template>
  <div>
    <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]">
      Values
    </div>
    <div v-if="data.tags.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in data.tags"
        :key="tag"
        class="rounded-full border border-[var(--profile-accent,#6e8761)] px-3 py-1 text-sm text-[var(--profile-text,#1a1a17)]"
      >{{ tag }}</span>
    </div>
    <p v-else class="text-sm italic text-warm-muted">Add your values…</p>
  </div>
</template>
```

```vue
<!-- app/components/blocks/edit/ValuesBlockEdit.vue -->
<script setup lang="ts">
import type { ValuesBlockData } from '~/types/blocks'
const props = defineProps<{ data: ValuesBlockData }>()
const emit = defineEmits<{ 'update:data': [data: ValuesBlockData] }>()
const tags = ref([...props.data.tags])
watch(tags, (v) => emit('update:data', { tags: [...v] }), { deep: true })
</script>
<template>
  <TagInput v-model="tags" label="Values" placeholder="Type a value, press Enter" />
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/blocks/display/InterestsBlock.vue app/components/blocks/edit/InterestsBlockEdit.vue \
        app/components/blocks/display/ValuesBlock.vue app/components/blocks/edit/ValuesBlockEdit.vue
git commit -m "feat: add Interests and Values block components"
```

---

### Task 15: Phase 4b stub blocks

These prevent runtime errors in `BlockRenderer` and `BlockEditor` when those block types appear. They render placeholders — fully implemented in Plan 4b.

**Files:** All files listed under Phase 4b stubs in the File Map above.

- [ ] **Step 1: Create stub display components**

Create each file with this content (substituting the label and icon for each):

```vue
<!-- app/components/blocks/display/PhotoSingleBlock.vue -->
<template>
  <div class="flex h-32 items-center justify-center rounded-lg bg-warm-bg text-sm text-warm-muted">
    🖼️ Photo — coming soon
  </div>
</template>
```

```vue
<!-- app/components/blocks/display/PhotoCarouselBlock.vue -->
<template>
  <div class="flex h-32 items-center justify-center rounded-lg bg-warm-bg text-sm text-warm-muted">
    🎠 Photo carousel — coming soon
  </div>
</template>
```

```vue
<!-- app/components/blocks/display/VideoBlock.vue -->
<template>
  <div class="flex h-32 items-center justify-center rounded-lg bg-warm-bg text-sm text-warm-muted">
    ▶️ Video — coming soon
  </div>
</template>
```

```vue
<!-- app/components/blocks/display/WebsitePreviewBlock.vue -->
<template>
  <div class="flex h-20 items-center justify-center rounded-lg bg-warm-bg text-sm text-warm-muted">
    🔗 Website preview — coming soon
  </div>
</template>
```

```vue
<!-- app/components/blocks/display/SocialLinksBlock.vue -->
<template>
  <div class="flex h-16 items-center justify-center rounded-lg bg-warm-bg text-sm text-warm-muted">
    🌐 Social links — coming soon
  </div>
</template>
```

```vue
<!-- app/components/blocks/display/ContactButtonBlock.vue -->
<template>
  <div class="flex h-16 items-center justify-center rounded-lg bg-warm-bg text-sm text-warm-muted">
    📬 Contact button — coming soon
  </div>
</template>
```

- [ ] **Step 2: Create stub edit components**

```vue
<!-- app/components/blocks/edit/PhotoSingleBlockEdit.vue -->
<template><p class="text-sm text-warm-muted">Photo upload coming in Phase 4b.</p></template>
```

```vue
<!-- app/components/blocks/edit/PhotoCarouselBlockEdit.vue -->
<template><p class="text-sm text-warm-muted">Photo carousel coming in Phase 4b.</p></template>
```

```vue
<!-- app/components/blocks/edit/VideoBlockEdit.vue -->
<template><p class="text-sm text-warm-muted">Video embed coming in Phase 4b.</p></template>
```

```vue
<!-- app/components/blocks/edit/WebsitePreviewBlockEdit.vue -->
<template><p class="text-sm text-warm-muted">Website preview coming in Phase 4b.</p></template>
```

```vue
<!-- app/components/blocks/edit/SocialLinksBlockEdit.vue -->
<template><p class="text-sm text-warm-muted">Social links coming in Phase 4b.</p></template>
```

```vue
<!-- app/components/blocks/edit/ContactButtonBlockEdit.vue -->
<template><p class="text-sm text-warm-muted">Contact button coming in Phase 4b.</p></template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/blocks/
git commit -m "feat: add Phase 4b stub block components"
```

---

### Task 16: ThemeSidebar

**Files:**
- Create: `app/components/editor/ThemeSidebar.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/editor/ThemeSidebar.vue -->
<script setup lang="ts">
import { THEME_PRESETS, type Theme, type ThemePresetName } from '~/types/theme'

const props = defineProps<{ theme: Theme }>()
const emit = defineEmits<{ 'update:theme': [theme: Theme] }>()

const presetNames = Object.keys(THEME_PRESETS) as ThemePresetName[]

const presetLabels: Record<ThemePresetName, string> = {
  'sage-linen': 'Sage & Linen',
  'midnight': 'Midnight',
  'blossom': 'Blossom',
  'bold': 'Bold',
  'golden-hour': 'Golden Hour',
  'paper': 'Paper',
}

function selectPreset(name: ThemePresetName) {
  emit('update:theme', { preset: name, ...THEME_PRESETS[name] })
}
</script>

<template>
  <aside class="flex h-full w-64 shrink-0 flex-col border-l border-warm-border bg-warm-card">
    <div class="border-b border-warm-border px-4 py-3">
      <h2 class="text-sm font-semibold text-warm-text">Theme</h2>
      <p class="mt-0.5 text-xs text-warm-muted">Full editor coming in Plan 4b</p>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <p class="mb-3 text-xs font-medium text-warm-muted">Choose a preset</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="name in presetNames"
          :key="name"
          :class="[
            'rounded-xl border-2 p-3 text-left transition-all',
            theme.preset === name ? 'border-sage-500' : 'border-transparent hover:border-warm-border',
          ]"
          :style="{
            backgroundColor: THEME_PRESETS[name].backgroundColor,
          }"
          @click="selectPreset(name)"
        >
          <!-- Color swatch strip -->
          <div class="mb-2 flex gap-0.5">
            <div class="h-2 w-3 rounded-sm" :style="{ backgroundColor: THEME_PRESETS[name].accentColor }" />
            <div class="h-2 w-3 rounded-sm" :style="{ backgroundColor: THEME_PRESETS[name].surfaceColor }" />
            <div class="h-2 w-3 rounded-sm" :style="{ backgroundColor: THEME_PRESETS[name].textColor }" />
          </div>
          <div class="text-xs font-medium" :style="{ color: THEME_PRESETS[name].textColor }">
            {{ presetLabels[name] }}
          </div>
        </button>
      </div>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/editor/ThemeSidebar.vue
git commit -m "feat: add ThemeSidebar with 6 preset swatches"
```

---

### Task 17: Dashboard layout nav update

**Files:**
- Modify: `app/layouts/dashboard.vue`

- [ ] **Step 1: Update the layout to show save status and sign out**

```vue
<!-- app/layouts/dashboard.vue -->
<script setup lang="ts">
const { signOut } = useAuth()
const saveStatus = inject<Ref<string>>('saveStatus', ref('idle'))

async function handleSignOut() {
  await signOut()
  await navigateTo('/signin')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-warm-bg">
    <nav class="sticky top-0 z-40 border-b border-warm-border bg-warm-card">
      <div class="flex h-14 items-center justify-between px-6">
        <NuxtLink to="/" class="font-handwriting text-xl text-sage-600">ntmy</NuxtLink>
        <div class="flex items-center gap-4">
          <span v-if="saveStatus === 'saving'" class="text-xs text-warm-muted">Saving…</span>
          <span v-else-if="saveStatus === 'saved'" class="text-xs text-sage-600">Saved ✓</span>
          <span v-else-if="saveStatus === 'error'" class="text-xs text-red-500">Failed to save</span>
          <button
            class="text-sm text-warm-muted transition-colors hover:text-warm-text"
            @click="handleSignOut"
          >Sign out</button>
        </div>
      </div>
    </nav>
    <slot />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/layouts/dashboard.vue
git commit -m "feat: update dashboard layout with save status and sign out"
```

---

### Task 18: Add Google Fonts for theme presets

**Files:**
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Add Google Fonts to head**

In `nuxt.config.ts`, add an `app.head` section:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Caveat:wght@600&family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Lato:wght@400;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  components: [
    { path: '~/components', pathPrefix: false },
  ],
  css: ['~/assets/css/main.css'],

  nitro: {
    preset: 'node-server',
  },

  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/onboarding': { ssr: false },
  },

  runtimeConfig: {
    public: {
      appUrl: '',
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add nuxt.config.ts
git commit -m "feat: add Google Fonts for theme presets"
```

---

### Task 19: Wire dashboard/index.vue

**Files:**
- Modify: `app/pages/dashboard/index.vue`

- [ ] **Step 1: Rewrite the page**

```vue
<!-- app/pages/dashboard/index.vue -->
<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { applyTheme } from '~/types/theme'
import type { BlockMeta, AnyBlock } from '~/types/blocks'

definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })

const {
  blocks,
  theme,
  saveStatus,
  loadProfile,
  addBlock,
  updateBlockData,
  updateBlockWidth,
  removeBlock,
  reorderBlocks,
  setTheme,
  existingBlockTypes,
  newBlockId,
} = useProfile()

// Expose saveStatus to layout via provide so the nav can show it
provide('saveStatus', saveStatus)

// Apply theme CSS vars to the canvas whenever theme changes
const canvasRef = ref<HTMLElement | null>(null)
watchEffect(() => {
  if (canvasRef.value) applyTheme(canvasRef.value, theme.value)
})

// UI state
const showPicker = ref(false)
const editingBlockId = ref<string | null>(null)
const showTheme = ref(false)

const editingBlock = computed(() =>
  editingBlockId.value
    ? blocks.value.find(b => b.id === editingBlockId.value) ?? null
    : null
)

function handlePickerSelect(meta: BlockMeta) {
  const newBlock: AnyBlock = {
    id: newBlockId(),
    type: meta.type,
    width: 'full',
    data: { ...meta.defaultData } as AnyBlock['data'],
  }
  addBlock(newBlock)
  showPicker.value = false
  editingBlockId.value = newBlock.id
}

function handleUpdateData(id: string, data: AnyBlock['data']) {
  updateBlockData(id, data)
}

onMounted(loadProfile)
</script>

<template>
  <div class="flex h-[calc(100vh-56px)]">
    <!-- Canvas -->
    <div class="flex-1 overflow-y-auto">
      <div
        ref="canvasRef"
        class="min-h-full p-6 transition-colors duration-500"
        :style="{ backgroundColor: theme.backgroundColor }"
      >
        <div class="mx-auto max-w-2xl">
          <!-- Empty state -->
          <div
            v-if="blocks.length === 0"
            class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-border py-24 text-center"
          >
            <p class="mb-1 text-base font-medium text-warm-text">Your profile is empty</p>
            <p class="mb-6 text-sm text-warm-muted">Add blocks to start building your page</p>
            <AppButton @click="showPicker = true">+ Add your first block</AppButton>
          </div>

          <!-- Block canvas -->
          <BlockCanvas
            v-else
            :blocks="blocks"
            @update:blocks="reorderBlocks"
            @edit-block="editingBlockId = $event"
          />

          <!-- Add block button (when blocks exist) -->
          <div v-if="blocks.length > 0" class="mt-6 text-center">
            <AppButton variant="secondary" @click="showPicker = true">
              + Add block
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme sidebar -->
    <ThemeSidebar
      v-if="showTheme"
      :theme="theme"
      @update:theme="setTheme"
    />
  </div>

  <!-- Theme toggle (floating) -->
  <div class="fixed bottom-6 right-6 z-30">
    <AppButton variant="secondary" @click="showTheme = !showTheme">
      🎨 {{ showTheme ? 'Close' : 'Theme' }}
    </AppButton>
  </div>

  <!-- Block picker modal -->
  <BlockPicker
    v-if="showPicker"
    :existing-block-types="existingBlockTypes()"
    @select="handlePickerSelect"
    @close="showPicker = false"
  />

  <!-- Block edit popup -->
  <BlockPopup
    v-if="editingBlock"
    :title="editingBlock.type.replace(/_/g, ' ')"
    :width="editingBlock.width"
    @update:width="updateBlockWidth(editingBlock.id, $event)"
    @delete="removeBlock(editingBlock.id)"
    @close="editingBlockId = null"
  >
    <BlockEditor
      :block="editingBlock"
      @update:data="handleUpdateData(editingBlock.id, $event)"
    />
  </BlockPopup>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/dashboard/index.vue
git commit -m "feat: wire dashboard editor page"
```

---

### Task 20: Playwright verification

- [ ] **Step 1: Ensure the dev server and Docker services are running**

```bash
# From WSL (Docker must be running):
# wsl bash -c "sudo service docker start && cd /path/to/repo && docker compose up -d"
# Then from Windows:
npm run dev
```

- [ ] **Step 2: Sign in and reach the dashboard**

Using Playwright browser tools:
1. Navigate to `http://localhost:3000/signin`
2. Sign in with a test account (any account that has completed onboarding)
3. Confirm redirect to `/dashboard`
4. Confirm the empty state renders ("Your profile is empty" + "Add your first block" button)

- [ ] **Step 3: Add a Bio block**

1. Click "+ Add your first block"
2. Confirm the block picker opens — 14 block types visible
3. Click "Bio"
4. Confirm the BlockPopup opens with a Tiptap editor
5. Type: "Hi, I'm testing the profile editor."
6. Confirm text appears in the editor
7. Click ✕ to close
8. Confirm the Bio block appears on the canvas with the text rendered

- [ ] **Step 4: Test single-instance enforcement**

1. Click "+ Add block"
2. Confirm "Bio" is greyed out / disabled (already added)
3. Click "Interests"
4. Type "coffee" → Enter → "hiking" → Enter
5. Close the popup
6. Confirm the Interests block shows two chips on the canvas

- [ ] **Step 5: Test drag-to-reorder**

1. Add a "Location" block with the text "New York, NY"
2. Hover over the Interests block — confirm the ⠿ drag handle appears
3. Drag the Interests block above the Bio block
4. Confirm the order changes on the canvas

- [ ] **Step 6: Test delete**

1. Click the Location block to open its popup
2. Click "Delete block"
3. Confirm the confirmation state appears ("Cancel" and "Yes, delete" buttons)
4. Click "Yes, delete"
5. Confirm the Location block is gone from the canvas

- [ ] **Step 7: Test width toggle**

1. Add a "Currently" block
2. Open its popup
3. Click "Half"
4. Close the popup
5. Confirm the block is half-width on the canvas

- [ ] **Step 8: Test theme presets**

1. Click "🎨 Theme"
2. Confirm the theme sidebar slides in with 6 preset swatches
3. Click "Midnight"
4. Confirm the canvas background transitions to dark
5. Click "Blossom"
6. Confirm the canvas transitions to the blush/pink palette

- [ ] **Step 9: Verify auto-save**

1. Edit any block's content
2. Wait 2 seconds without interacting
3. Confirm "Saving…" appears in the nav, then "Saved ✓"
4. Hard-reload the page (`Ctrl+Shift+R`)
5. Confirm blocks and theme are restored from the server

- [ ] **Step 10: Take screenshots for design review**

Capture:
- Dashboard with 4–5 blocks, default Sage & Linen theme
- Dashboard with the Midnight theme active
- Block picker modal open
- A block edit popup open

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "feat: Phase 4a — profile editor foundation with text blocks and theme presets"
```

---

## What's in Plan 4b

After design review of Plan 4a, Plan 4b will implement:

- **`photo_single`** — file upload to R2 via presigned URL, display with caption
- **`photo_carousel`** — multi-photo upload, swipeable display
- **`video`** — YouTube/Vimeo URL parser + oEmbed embed
- **`website_preview`** — `GET /api/url-preview` server-side scraper (OG tags), rich preview card
- **`social_links`** — platform link manager (Instagram, Spotify, LinkedIn, etc.)
- **`contact_button`** — placeholder label editor (form wired up in Phase 6)
- **Full theme custom editor** — color pickers, font family dropdowns, border radius + shadow toggles in the ThemeSidebar
