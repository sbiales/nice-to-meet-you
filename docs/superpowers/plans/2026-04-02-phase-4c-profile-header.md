# Phase 4c: Profile Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed profile header above the block canvas with an editable display name, tagline prefix, and banner image upload — all persisted to the database and reflected in the editor's live preview.

**Architecture:** A new `ProfileHeader.vue` editor component sits above `BlockCanvas` in the dashboard. `useProfile` gains three new reactive fields (`taglinePrefix`, `displayName`, `headerImageKey`) and an `uploadHeaderImage()` action. A new `tagline_prefix` column is added to `profiles` via a Drizzle migration. A new `POST /api/profiles/header-image` endpoint handles file upload and writes the storage key directly to the profile row. `PATCH /api/profiles/me` is extended to accept `taglinePrefix` and `displayName`.

**Tech Stack:** Drizzle ORM (schema + migration), Vitest (DB-layer tests), Vue 3 (component), S3-compatible storage via existing `uploadFile` util.

---

### Task 1: DB migration — add tagline_prefix column

**Files:**
- Modify: `server/db/schema/profiles.ts`
- Create (auto-generated): `server/db/migrations/<timestamp>.sql`
- Create: `__tests__/db/tagline-prefix.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/db/tagline-prefix.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { profiles } from '~~/server/db/schema/profiles'
import { user } from '~~/server/db/schema/auth'

const TEST_USER_ID = 'tagline-test-user-id'
const TEST_USERNAME = 'tagline_test_user'

beforeAll(async () => {
  await db.insert(user).values({
    id: TEST_USER_ID,
    name: 'Tagline Test',
    email: 'taglinetest@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing()
  await db.insert(profiles).values({
    userId: TEST_USER_ID,
    username: TEST_USERNAME,
    displayName: 'Tagline Test User',
  }).onConflictDoNothing()
})

afterAll(async () => {
  await db.delete(profiles).where(eq(profiles.userId, TEST_USER_ID))
  await db.delete(user).where(eq(user.id, TEST_USER_ID))
})

describe('tagline_prefix column', () => {
  it('persists a tagline prefix string', async () => {
    await db.update(profiles)
      .set({ taglinePrefix: 'Hi, my name is', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })
    expect(row?.taglinePrefix).toBe('Hi, my name is')
  })

  it('allows null tagline prefix', async () => {
    await db.update(profiles)
      .set({ taglinePrefix: null, updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })
    expect(row?.taglinePrefix).toBeNull()
  })

  it('persists a header image key', async () => {
    const fakeKey = `headers/some-profile-id/test.jpg`
    await db.update(profiles)
      .set({ headerImageKey: fakeKey, updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })
    expect(row?.headerImageKey).toBe(fakeKey)
  })
})
```

- [ ] **Step 2: Run test — expect failure** (column doesn't exist yet)

```bash
npm test -- --testPathPattern="tagline-prefix"
```
Expected: FAIL — TypeScript error on `taglinePrefix` property

- [ ] **Step 3: Add taglinePrefix to profiles schema**

```typescript
// server/db/schema/profiles.ts — add one line after headerImageKey
  headerImageKey: text('header_image_key'),
  taglinePrefix: text('tagline_prefix'),   // ← add this line
```

- [ ] **Step 4: Generate and apply migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Expected: new `.sql` file appears in `server/db/migrations/`, migration applied successfully.

- [ ] **Step 5: Run test — expect pass**

```bash
npm test -- --testPathPattern="tagline-prefix"
```
Expected: all 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add server/db/schema/profiles.ts server/db/migrations/ __tests__/db/tagline-prefix.test.ts
git commit -m "feat: add tagline_prefix column to profiles"
```

---

### Task 2: Extend PATCH /api/profiles/me for taglinePrefix and displayName

**Files:**
- Modify: `server/api/profiles/me.patch.ts`

- [ ] **Step 1: Update the endpoint** (full file replacement)

```typescript
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

  if (body?.taglinePrefix !== undefined) {
    if (body.taglinePrefix !== null && typeof body.taglinePrefix !== 'string') {
      throw createError({ statusCode: 400, message: 'taglinePrefix must be a string or null' })
    }
    updates.taglinePrefix = body.taglinePrefix
  }

  if (body?.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim() === '') {
      throw createError({ statusCode: 400, message: 'displayName must be a non-empty string' })
    }
    updates.displayName = body.displayName.trim()
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

- [ ] **Step 2: Run tests + typecheck**

```bash
npm test && npx nuxi typecheck
```
Expected: all PASS, no errors

- [ ] **Step 3: Commit**

```bash
git add server/api/profiles/me.patch.ts
git commit -m "feat: extend PATCH /api/profiles/me to accept taglinePrefix and displayName"
```

---

### Task 3: POST /api/profiles/header-image endpoint

**Files:**
- Create: `server/api/profiles/header-image.post.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
// server/api/profiles/header-image.post.ts
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { uploadFile } from '../../utils/storage'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No form data' })
  }

  const filePart = formData.find((p) => p.name === 'file')
  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'Missing file' })
  }

  const contentType = filePart.type ?? 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw createError({ statusCode: 415, message: 'Only jpeg, png, webp, or gif allowed' })
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, message: 'File too large (max 5 MB)' })
  }

  const ext = filePart.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storageKey = `headers/${profile.id}/${randomUUID()}.${ext}`

  await uploadFile(storageKey, filePart.data, contentType)

  await db.update(profiles)
    .set({ headerImageKey: storageKey, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))

  return { storageKey }
})
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add server/api/profiles/header-image.post.ts
git commit -m "feat: add POST /api/profiles/header-image endpoint"
```

---

### Task 4: Update useProfile composable

**Files:**
- Modify: `app/composables/useProfile.ts`

- [ ] **Step 1: Replace with updated composable**

```typescript
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
  const displayName = ref<string>('')
  const taglinePrefix = ref<string | null>(null)
  const headerImageKey = ref<string | null>(null)
  const headerUploading = ref(false)
  const saveStatus = ref<SaveStatus>('idle')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function loadProfile() {
    const data = await $fetch<Record<string, unknown>>('/api/profiles/me')
    profile.value = data
    blocks.value = Array.isArray(data.blocks) ? (data.blocks as AnyBlock[]) : []
    theme.value = data.theme && Object.keys(data.theme as object).length
      ? (data.theme as Theme)
      : { ...DEFAULT_THEME }
    displayName.value = typeof data.displayName === 'string' ? data.displayName : ''
    taglinePrefix.value = typeof data.taglinePrefix === 'string' ? data.taglinePrefix : null
    headerImageKey.value = typeof data.headerImageKey === 'string' ? data.headerImageKey : null
  }

  async function save() {
    if (!displayName.value.trim()) return
    saveStatus.value = 'saving'
    try {
      await $fetch('/api/profiles/me', {
        method: 'PATCH',
        body: {
          blocks: blocks.value,
          theme: theme.value,
          taglinePrefix: taglinePrefix.value,
          displayName: displayName.value.trim(),
        },
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

  watch(blocks, scheduleSave, { deep: true })
  watch(theme, scheduleSave, { deep: true })
  watch(taglinePrefix, scheduleSave)
  watch(displayName, scheduleSave)

  async function uploadHeaderImage(file: File) {
    headerUploading.value = true
    try {
      const form = new FormData()
      form.append('file', file)
      const result = await $fetch<{ storageKey: string }>('/api/profiles/header-image', {
        method: 'POST',
        body: form,
      })
      headerImageKey.value = result.storageKey
    } finally {
      headerUploading.value = false
    }
  }

  function addBlock(block: AnyBlock) {
    blocks.value = [...blocks.value, block]
  }

  function updateBlockData(id: string, data: AnyBlock['data']) {
    blocks.value = blocks.value.map(b =>
      b.id === id ? ({ ...b, data }) as AnyBlock : b
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

  function setTaglinePrefix(value: string | null) {
    taglinePrefix.value = value
  }

  function setDisplayName(value: string) {
    displayName.value = value
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
    displayName,
    taglinePrefix,
    headerImageKey,
    headerUploading,
    saveStatus,
    loadProfile,
    uploadHeaderImage,
    addBlock,
    updateBlockData,
    updateBlockWidth,
    removeBlock,
    reorderBlocks,
    setTheme,
    setTaglinePrefix,
    setDisplayName,
    existingBlockTypes,
    newBlockId,
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/composables/useProfile.ts
git commit -m "feat: add taglinePrefix, displayName, headerImageKey, uploadHeaderImage to useProfile"
```

---

### Task 5: Create ProfileHeader.vue editor component

**Files:**
- Create: `app/components/editor/ProfileHeader.vue`

The banner area is `h-44 sm:h-56` with `object-fit: cover`. The tagline prefix picker (chip row) sits above the banner. The display name and tagline prefix are overlaid on the banner with a bottom gradient. Clicking the banner triggers the file input; clicking the display name opens an inline text input.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/editor/ProfileHeader.vue -->
<script setup lang="ts">
import type { Theme } from '~/types/theme'

const props = defineProps<{
  displayName: string
  taglinePrefix: string | null
  headerImageKey: string | null
  theme: Theme
  uploading: boolean
}>()

const emit = defineEmits<{
  'update:taglinePrefix': [value: string | null]
  'update:displayName': [value: string]
  'upload-header-image': [file: File]
}>()

const config = useRuntimeConfig()
const bannerUrl = computed(() =>
  props.headerImageKey
    ? `${config.public.storagePublicUrl}/${props.headerImageKey}`
    : null
)

const TAGLINE_PRESETS = ['Hi, my name is', 'Meet', 'This is']

const isCustom = computed(
  () => props.taglinePrefix !== null && !TAGLINE_PRESETS.includes(props.taglinePrefix)
)
const customValue = ref(isCustom.value ? (props.taglinePrefix ?? '') : '')
const showCustomInput = ref(isCustom.value)

function selectPreset(preset: string) {
  showCustomInput.value = false
  emit('update:taglinePrefix', preset)
}

function clearTagline() {
  showCustomInput.value = false
  emit('update:taglinePrefix', null)
}

function openCustom() {
  showCustomInput.value = true
  customValue.value = isCustom.value ? (props.taglinePrefix ?? '') : ''
}

function commitCustom() {
  const trimmed = customValue.value.trim()
  emit('update:taglinePrefix', trimmed || null)
}

const fileInput = ref<HTMLInputElement | null>(null)

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('upload-header-image', file)
}

const editingName = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)
const localName = ref(props.displayName)

watch(() => props.displayName, (v) => { localName.value = v })

function startEditName() {
  editingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}

function commitName() {
  editingName.value = false
  if (localName.value.trim()) emit('update:displayName', localName.value.trim())
  else localName.value = props.displayName
}
</script>

<template>
  <div>
    <!-- Tagline prefix picker -->
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <button
        v-for="preset in TAGLINE_PRESETS"
        :key="preset"
        class="rounded-full border px-3 py-1 text-sm transition-colors"
        :class="taglinePrefix === preset
          ? 'border-transparent bg-warm-text text-white'
          : 'border-warm-border text-warm-muted hover:border-warm-text'"
        @click="selectPreset(preset)"
      >
        {{ preset }}
      </button>
      <button
        class="rounded-full border px-3 py-1 text-sm transition-colors"
        :class="isCustom
          ? 'border-transparent bg-warm-text text-white'
          : 'border-warm-border text-warm-muted hover:border-warm-text'"
        @click="openCustom"
      >
        Custom…
      </button>
      <button
        v-if="taglinePrefix !== null"
        class="rounded-full border border-warm-border px-3 py-1 text-sm text-warm-muted hover:border-red-400 hover:text-red-500"
        @click="clearTagline"
      >
        ✕ Remove
      </button>
    </div>

    <!-- Custom tagline input -->
    <div v-if="showCustomInput" class="mb-2 flex gap-2">
      <input
        v-model="customValue"
        class="flex-1 rounded-lg border border-warm-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-text"
        placeholder="Write your own…"
        @keydown.enter="commitCustom"
        @blur="commitCustom"
      />
    </div>

    <!-- Banner area -->
    <div
      class="group relative h-44 w-full overflow-hidden rounded-xl sm:h-56"
      :style="{ backgroundColor: theme.backgroundColor }"
    >
      <img
        v-if="bannerUrl"
        :src="bannerUrl"
        alt=""
        class="h-full w-full object-cover"
      />

      <!-- Bottom gradient for text legibility -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <!-- Upload button — visible on hover -->
      <button
        class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        :disabled="uploading"
        @click="fileInput?.click()"
      >
        <span class="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white">
          {{ uploading ? 'Uploading…' : bannerUrl ? 'Change banner' : '+ Add banner' }}
        </span>
      </button>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Name + tagline overlay at bottom center -->
      <div class="absolute inset-x-0 bottom-0 flex flex-col items-center pb-5 text-center">
        <p
          v-if="taglinePrefix"
          class="mb-1 text-sm"
          :style="{ color: 'rgba(255,255,255,0.8)', fontFamily: theme.bodyFont }"
        >
          {{ taglinePrefix }}
        </p>
        <button
          v-if="!editingName"
          class="text-2xl font-bold text-white sm:text-3xl"
          :style="{ fontFamily: theme.headingFont, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }"
          @click="startEditName"
        >
          {{ displayName }}
          <span class="ml-1 text-base opacity-50">✎</span>
        </button>
        <input
          v-else
          ref="nameInputRef"
          v-model="localName"
          class="rounded bg-black/30 px-3 py-1 text-center text-2xl font-bold text-white placeholder-white/50 focus:outline-none sm:text-3xl"
          :style="{ fontFamily: theme.headingFont }"
          placeholder="Your name"
          @keydown.enter="commitName"
          @blur="commitName"
        />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/components/editor/ProfileHeader.vue
git commit -m "feat: add ProfileHeader editor component"
```

---

### Task 6: Wire ProfileHeader into dashboard/index.vue

**Files:**
- Modify: `app/pages/dashboard/index.vue`

- [ ] **Step 1: Update dashboard page** (full file replacement)

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
  displayName,
  taglinePrefix,
  headerImageKey,
  headerUploading,
  saveStatus,
  loadProfile,
  addBlock,
  updateBlockData,
  updateBlockWidth,
  removeBlock,
  reorderBlocks,
  setTheme,
  setTaglinePrefix,
  setDisplayName,
  uploadHeaderImage,
  existingBlockTypes,
  newBlockId,
} = useProfile()

provide('saveStatus', saveStatus)

const canvasRef = ref<HTMLElement | null>(null)
watchEffect(() => {
  if (canvasRef.value) applyTheme(canvasRef.value, theme.value)
})

const showPicker = ref(false)
const editingBlockId = ref<string | null>(null)
const showTheme = ref(false)

const editingBlock = computed(() =>
  editingBlockId.value
    ? blocks.value.find(b => b.id === editingBlockId.value) ?? null
    : null
)

function handlePickerSelect(meta: BlockMeta) {
  const newBlock = {
    id: newBlockId(),
    type: meta.type,
    width: 'full' as const,
    data: { ...meta.defaultData },
  } as AnyBlock
  addBlock(newBlock)
  showPicker.value = false
  editingBlockId.value = newBlock.id
}

function handleUpdateData(id: string, data: AnyBlock['data']) {
  updateBlockData(id, data)
}

async function handleHeaderImageUpload(file: File) {
  await uploadHeaderImage(file)
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
        <div class="mx-auto max-w-2xl space-y-6">
          <!-- Profile header -->
          <ProfileHeader
            :display-name="displayName"
            :tagline-prefix="taglinePrefix"
            :header-image-key="headerImageKey"
            :theme="theme"
            :uploading="headerUploading"
            @update:tagline-prefix="setTaglinePrefix"
            @update:display-name="setDisplayName"
            @upload-header-image="handleHeaderImageUpload"
          />

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
          <div v-if="blocks.length > 0" class="text-center">
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

- [ ] **Step 2: Run tests + typecheck**

```bash
npm test && npx nuxi typecheck
```
Expected: all PASS, no errors

- [ ] **Step 3: Commit**

```bash
git add app/pages/dashboard/index.vue
git commit -m "feat: wire ProfileHeader into dashboard editor"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite + typecheck**

```bash
npm test && npx nuxi typecheck
```
Expected: all PASS, no type errors

- [ ] **Step 2: Playwright verification** (start dev server first: `nuxt dev`)

1. Sign in and navigate to the dashboard
2. Verify `ProfileHeader` renders above the block canvas
3. Click a tagline preset chip — verify it highlights and the text appears overlaid on the banner
4. Click the banner area — verify the upload overlay appears on hover with "Add banner" label
5. Click the display name — verify inline input appears; type a new name, press Enter — verify name updates and auto-save triggers
6. Switch themes in ThemeSidebar — verify header font and gradient update in real time
7. Open the browser console — verify no errors

- [ ] **Step 3: Kill dev server**

```bash
npx kill-port 3000
```

- [ ] **Step 4: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 4c: Profile header — banner, tagline prefix, editable display name" --body "$(cat <<'EOF'
## Summary
- Adds `tagline_prefix` column to `profiles` via Drizzle migration
- New `POST /api/profiles/header-image` endpoint for banner upload (stored at `headers/{profileId}/{uuid}.ext`)
- Extends `PATCH /api/profiles/me` to accept `taglinePrefix` and `displayName`
- Updates `useProfile` composable with new state fields and `uploadHeaderImage()` action
- New `ProfileHeader.vue` editor component: banner image (hover to upload), tagline prefix picker (3 presets + custom), inline-editable display name
- Wires `ProfileHeader` into the dashboard above the block canvas

## Test plan
- [ ] `npm test` passes
- [ ] `npx nuxi typecheck` passes
- [ ] Dashboard shows ProfileHeader above block canvas
- [ ] Tagline prefix picker highlights active preset and renders text over banner
- [ ] Banner hover shows upload overlay; clicking triggers file picker
- [ ] Display name click opens inline input; blur/Enter saves and triggers auto-save
- [ ] Theme changes update header font/colors in real time
EOF
)"
```
