# Phase 4b: Profile Editor Media Blocks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the profile editor by implementing all 6 remaining blocks (photo_single, photo_carousel, video, website_preview, social_links, contact_button) and the full theme customization editor.

**Architecture:** Photo blocks use a dedicated upload pipeline (POST /api/photos → MinIO/R2 via `@aws-sdk/client-s3`, already installed) and store `storageKey` inline in block JSONB so rendering is self-contained without extra DB joins. Video blocks parse YouTube/Vimeo URLs client-side into embed URLs. Website preview blocks call a server-side `/api/og` endpoint to fetch OG metadata (bypasses CORS). Social links and the contact button have no server dependencies in this phase. The theme editor replaces the Phase 4a preset-only stub with full color pickers, font dropdowns, and border/shadow toggles.

**Tech Stack:** Nuxt 4 + H3, Vue 3, `@aws-sdk/client-s3` (already installed), `node-html-parser` (new), `vue-draggable-plus` (already installed), Vitest (`__tests__/`), Playwright MCP for UI verification.

---

## Prerequisites

```bash
# Start Docker services (WSL)
wsl bash -c "sudo service docker start && cd /mnt/c/Users/siena/repositories/nice-to-meet-you && docker compose up -d"

# MinIO bucket may need to be created on first run — open http://localhost:9001
# Login: minioadmin / minioadmin
# Create bucket named: nicetomeetyou
# Set bucket access policy to public

# Ensure .env is up to date
cp .env.local .env

# Create a new branch
git checkout main && git pull
git checkout -b phase-4b-media-blocks
```

---

## File Map

**Create:**
- `server/utils/storage.ts` — S3 client, `uploadFile`, `deleteFile`, `getPublicUrl`
- `server/utils/og.ts` — `extractOgMetadata` pure function
- `server/api/photos/index.post.ts` — multipart photo upload
- `server/api/photos/[id].delete.ts` — delete photo from storage + DB
- `server/api/og.get.ts` — fetch OG metadata for a URL
- `app/composables/usePhotoUpload.ts` — `upload`, `remove`, `getPhotoUrl`
- `app/utils/video.ts` — `getVideoEmbedUrl` pure utility
- `__tests__/server/storage.test.ts`
- `__tests__/server/og.test.ts`
- `__tests__/utils/video.test.ts`

**Modify:**
- `app/types/blocks.ts` — `PhotoCarouselBlockData`: `photoIds[]` → `photos[]`; `SocialLink`: add `isVisible`
- `nuxt.config.ts` — add `storagePublicUrl` to `runtimeConfig.public`
- `app/components/blocks/display/PhotoSingleBlock.vue` — replace placeholder
- `app/components/blocks/edit/PhotoSingleBlockEdit.vue` — replace placeholder
- `app/components/blocks/display/PhotoCarouselBlock.vue` — replace placeholder
- `app/components/blocks/edit/PhotoCarouselBlockEdit.vue` — replace placeholder
- `app/components/blocks/display/VideoBlock.vue` — replace placeholder
- `app/components/blocks/edit/VideoBlockEdit.vue` — replace placeholder
- `app/components/blocks/display/WebsitePreviewBlock.vue` — replace placeholder
- `app/components/blocks/edit/WebsitePreviewBlockEdit.vue` — replace placeholder
- `app/components/blocks/display/SocialLinksBlock.vue` — replace placeholder
- `app/components/blocks/edit/SocialLinksBlockEdit.vue` — replace placeholder
- `app/components/blocks/display/ContactButtonBlock.vue` — replace placeholder
- `app/components/blocks/edit/ContactButtonBlockEdit.vue` — replace placeholder
- `app/components/editor/ThemeSidebar.vue` — replace stub

---

## Task 1: Update Block Types

**Files:**
- Modify: `app/types/blocks.ts`

- [ ] **Step 1: Install node-html-parser (needed in Task 5)**

```bash
npm install node-html-parser --legacy-peer-deps
```

Expected: Installs cleanly or with peer dep warnings only (not errors).

- [ ] **Step 2: Update PhotoCarouselBlockData**

In `app/types/blocks.ts`, change:

```typescript
export interface PhotoCarouselBlockData {
  photoIds: string[]
}
```

To:

```typescript
export interface PhotoCarouselBlockData {
  photos: Array<{ id: string; storageKey: string }>
}
```

- [ ] **Step 3: Add isVisible to SocialLink**

Change:

```typescript
export interface SocialLink {
  platform: SocialPlatform
  url: string
  label: string
}
```

To:

```typescript
export interface SocialLink {
  platform: SocialPlatform
  url: string
  label: string
  isVisible: boolean
}
```

- [ ] **Step 4: Update BLOCK_META defaultData for photo_carousel**

Find the `photo_carousel` entry in `BLOCK_META` and change its `defaultData`:

```typescript
{
  type: 'photo_carousel',
  label: 'Photo Carousel',
  description: 'Multiple photos in a swipeable carousel',
  icon: '🎠',
  defaultData: { photos: [] } as PhotoCarouselBlockData,
},
```

- [ ] **Step 5: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors related to the changed types. (Placeholder components referencing `photoIds` or missing `isVisible` will be fixed in later tasks — ignore those for now.)

- [ ] **Step 6: Commit**

```bash
git add app/types/blocks.ts package.json package-lock.json
git commit -m "types: update PhotoCarouselBlockData to inline storageKey; add isVisible to SocialLink"
```

---

## Task 2: Storage Utility

**Files:**
- Create: `server/utils/storage.ts`
- Create: `__tests__/server/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/server/storage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('getPublicUrl', () => {
  beforeEach(() => {
    vi.stubEnv('S3_PUBLIC_URL', 'http://localhost:9000/nicetomeetyou')
  })

  it('constructs public URL from a storage key', async () => {
    const { getPublicUrl } = await import('../../server/utils/storage')
    expect(getPublicUrl('photos/profile-1/abc.jpg')).toBe(
      'http://localhost:9000/nicetomeetyou/photos/profile-1/abc.jpg'
    )
  })

  it('strips trailing slash from S3_PUBLIC_URL before joining', async () => {
    vi.stubEnv('S3_PUBLIC_URL', 'http://localhost:9000/nicetomeetyou/')
    const { getPublicUrl } = await import('../../server/utils/storage')
    const url = getPublicUrl('photos/profile-1/abc.jpg')
    expect(url).not.toMatch(/\/\/photos/)
    expect(url).toBe('http://localhost:9000/nicetomeetyou/photos/profile-1/abc.jpg')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/server/storage.test.ts
```

Expected: FAIL — "Cannot find module '../../server/utils/storage'"

- [ ] **Step 3: Implement storage.ts**

Create `server/utils/storage.ts`:

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO; harmless for R2
})

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }),
  )
}

export function getPublicUrl(key: string): string {
  const base = (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')
  return `${base}/${key}`
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/server/storage.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/utils/storage.ts __tests__/server/storage.test.ts
git commit -m "feat: add S3 storage utility (uploadFile, deleteFile, getPublicUrl)"
```

---

## Task 3: Photo Upload API

**Files:**
- Create: `server/api/photos/index.post.ts`

- [ ] **Step 1: Implement the upload endpoint**

Create `server/api/photos/index.post.ts`:

```typescript
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { photos } from '../../db/schema/photos'
import { profiles } from '../../db/schema/profiles'
import { uploadFile, getPublicUrl } from '../../utils/storage'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const filePart = parts.find((p) => p.name === 'file')
  if (!filePart?.filename || !filePart.data) {
    throw createError({ statusCode: 400, message: 'Missing file field' })
  }

  const contentType = filePart.type ?? 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw createError({
      statusCode: 400,
      message: 'File must be jpeg, png, webp, or gif',
    })
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, message: 'File exceeds 8 MB limit' })
  }

  const ext = filePart.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storageKey = `photos/${profile.id}/${uuidv4()}.${ext}`

  await uploadFile(storageKey, filePart.data, contentType)

  const [photo] = await db
    .insert(photos)
    .values({ profileId: profile.id, storageKey })
    .returning()

  return { id: photo.id, storageKey, url: getPublicUrl(storageKey) }
})
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors in `server/api/photos/index.post.ts`.

- [ ] **Step 3: Commit**

```bash
git add server/api/photos/index.post.ts
git commit -m "feat: add POST /api/photos — multipart photo upload to R2/MinIO"
```

---

## Task 4: Photo Delete API

**Files:**
- Create: `server/api/photos/[id].delete.ts`

- [ ] **Step 1: Implement the delete endpoint**

Create `server/api/photos/[id].delete.ts`:

```typescript
import { eq, and } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { photos } from '../../db/schema/photos'
import { profiles } from '../../db/schema/profiles'
import { deleteFile } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const photoId = getRouterParam(event, 'id')
  if (!photoId) {
    throw createError({ statusCode: 400, message: 'Missing photo id' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.profileId, profile.id)))

  if (!photo) {
    throw createError({ statusCode: 404, message: 'Photo not found' })
  }

  await deleteFile(photo.storageKey)
  await db.delete(photos).where(eq(photos.id, photoId))

  return { success: true }
})
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/api/photos/[id].delete.ts
git commit -m "feat: add DELETE /api/photos/:id — removes photo from storage and DB"
```

---

## Task 5: OG Metadata API

**Files:**
- Create: `server/utils/og.ts`
- Create: `server/api/og.get.ts`
- Create: `__tests__/server/og.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/server/og.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractOgMetadata } from '../../server/utils/og'

describe('extractOgMetadata', () => {
  it('extracts og:title, og:description, og:image', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Hello World" />
        <meta property="og:description" content="A great page" />
        <meta property="og:image" content="https://example.com/img.jpg" />
      </head></html>`
    const result = extractOgMetadata(html, 'https://example.com')
    expect(result.title).toBe('Hello World')
    expect(result.description).toBe('A great page')
    expect(result.imageUrl).toBe('https://example.com/img.jpg')
    expect(result.url).toBe('https://example.com')
  })

  it('falls back to <title> when og:title is absent', () => {
    const html = `<html><head><title>Fallback Title</title></head></html>`
    const result = extractOgMetadata(html, 'https://example.com')
    expect(result.title).toBe('Fallback Title')
  })

  it('returns empty strings when no metadata found', () => {
    const result = extractOgMetadata('<html><body>nothing</body></html>', 'https://example.com')
    expect(result.title).toBe('')
    expect(result.description).toBe('')
    expect(result.imageUrl).toBe('')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/server/og.test.ts
```

Expected: FAIL — "Cannot find module '../../server/utils/og'"

- [ ] **Step 3: Implement og.ts utility**

Create `server/utils/og.ts`:

```typescript
import { parse } from 'node-html-parser'

export interface OgMetadata {
  title: string
  description: string
  imageUrl: string
  url: string
}

export function extractOgMetadata(html: string, pageUrl: string): OgMetadata {
  const root = parse(html)

  const getMeta = (property: string): string =>
    root.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ?? ''

  const title =
    getMeta('og:title') ||
    root.querySelector('title')?.text?.trim() ||
    ''

  return {
    title,
    description: getMeta('og:description'),
    imageUrl: getMeta('og:image'),
    url: pageUrl,
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/server/og.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Implement the API route**

Create `server/api/og.get.ts`:

```typescript
import { extractOgMetadata } from '../utils/og'

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event) as { url?: string }

  if (!url) {
    throw createError({ statusCode: 400, message: 'Missing url query param' })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw createError({ statusCode: 400, message: 'URL must use http or https' })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NiceToMeetYouBot/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      return { title: '', description: '', imageUrl: '', url }
    }
    const html = await response.text()
    return extractOgMetadata(html, url)
  } catch {
    // Network errors, timeouts — return empty metadata rather than 500
    return { title: '', description: '', imageUrl: '', url }
  }
})
```

- [ ] **Step 6: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add server/utils/og.ts server/api/og.get.ts __tests__/server/og.test.ts
git commit -m "feat: add OG metadata utility and GET /api/og endpoint"
```

---

## Task 6: usePhotoUpload Composable + runtimeConfig

**Files:**
- Create: `app/composables/usePhotoUpload.ts`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Add storagePublicUrl to runtimeConfig**

In `nuxt.config.ts`, update the `runtimeConfig.public` block from:

```typescript
  runtimeConfig: {
    public: {
      appUrl: '',
    },
  },
```

To:

```typescript
  runtimeConfig: {
    public: {
      appUrl: '',
      storagePublicUrl: process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/nicetomeetyou',
    },
  },
```

- [ ] **Step 2: Implement usePhotoUpload.ts**

Create `app/composables/usePhotoUpload.ts`:

```typescript
export function usePhotoUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const config = useRuntimeConfig()

  async function upload(
    file: File,
  ): Promise<{ id: string; storageKey: string; url: string }> {
    uploading.value = true
    error.value = null
    try {
      const form = new FormData()
      form.append('file', file)
      return await $fetch<{ id: string; storageKey: string; url: string }>(
        '/api/photos',
        { method: 'POST', body: form },
      )
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      throw err
    } finally {
      uploading.value = false
    }
  }

  async function remove(photoId: string): Promise<void> {
    await $fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
  }

  function getPhotoUrl(storageKey: string): string {
    const base = (config.public.storagePublicUrl as string).replace(/\/$/, '')
    return `${base}/${storageKey}`
  }

  return { upload, remove, uploading, error, getPhotoUrl }
}
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/composables/usePhotoUpload.ts nuxt.config.ts
git commit -m "feat: add usePhotoUpload composable + storagePublicUrl in runtimeConfig"
```

---

## Task 7: Video Embed Utility + VideoBlock

**Files:**
- Create: `app/utils/video.ts`
- Create: `__tests__/utils/video.test.ts`
- Modify: `app/components/blocks/display/VideoBlock.vue`
- Modify: `app/components/blocks/edit/VideoBlockEdit.vue`

- [ ] **Step 1: Write the failing test**

Create `__tests__/utils/video.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getVideoEmbedUrl } from '../../app/utils/video'

describe('getVideoEmbedUrl', () => {
  it('converts youtube.com/watch URL', () => {
    expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('converts youtu.be short URL', () => {
    expect(getVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('converts vimeo.com URL', () => {
    expect(getVideoEmbedUrl('https://vimeo.com/123456789'))
      .toBe('https://player.vimeo.com/video/123456789')
  })

  it('returns null for unrecognized URL', () => {
    expect(getVideoEmbedUrl('https://example.com/video')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getVideoEmbedUrl('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/utils/video.test.ts
```

Expected: FAIL — "Cannot find module '../../app/utils/video'"

- [ ] **Step 3: Implement video.ts**

Create `app/utils/video.ts`:

```typescript
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null

  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return null
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/utils/video.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Implement VideoBlock display component**

Replace contents of `app/components/blocks/display/VideoBlock.vue`:

```vue
<script setup lang="ts">
import type { VideoBlockData } from '~/types/blocks'
import { getVideoEmbedUrl } from '~/utils/video'

const props = defineProps<{ data: VideoBlockData }>()
const embedUrl = computed(() => getVideoEmbedUrl(props.data.url))
</script>

<template>
  <div>
    <div
      v-if="data.title"
      class="mb-2 text-sm font-medium text-[var(--profile-text,#1a1a17)]"
    >
      {{ data.title }}
    </div>
    <div
      v-if="embedUrl"
      class="relative w-full overflow-hidden rounded-[var(--profile-radius,10px)]"
      style="padding-top: 56.25%"
    >
      <iframe
        :src="embedUrl"
        class="absolute inset-0 h-full w-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>
    <div
      v-else
      class="flex h-32 items-center justify-center rounded-[var(--profile-radius,10px)] bg-[var(--profile-surface,#fff)] text-sm text-[var(--profile-muted,#6b6860)]"
    >
      Add a YouTube or Vimeo URL to embed a video
    </div>
  </div>
</template>
```

- [ ] **Step 6: Implement VideoBlockEdit component**

Replace contents of `app/components/blocks/edit/VideoBlockEdit.vue`:

```vue
<script setup lang="ts">
import type { VideoBlockData } from '~/types/blocks'
import { getVideoEmbedUrl } from '~/utils/video'

const props = defineProps<{ data: VideoBlockData }>()
const emit = defineEmits<{ 'update:data': [data: VideoBlockData] }>()

const localData = reactive({ ...props.data })
const embedUrl = computed(() => getVideoEmbedUrl(localData.url))

watch(localData, () => emit('update:data', { ...localData }))
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">
        YouTube or Vimeo URL
      </label>
      <input
        v-model="localData.url"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        class="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted/50 focus:border-sage-400 focus:outline-none"
      />
      <p v-if="localData.url && !embedUrl" class="mt-1 text-xs text-red-500">
        Unrecognized URL — paste a YouTube or Vimeo link
      </p>
    </div>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">
        Title (optional)
      </label>
      <input
        v-model="localData.title"
        type="text"
        placeholder="e.g. My favorite talk"
        class="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted/50 focus:border-sage-400 focus:outline-none"
      />
    </div>
    <div
      v-if="embedUrl"
      class="relative w-full overflow-hidden rounded-lg"
      style="padding-top: 56.25%"
    >
      <iframe
        :src="embedUrl"
        class="absolute inset-0 h-full w-full"
        frameborder="0"
        allowfullscreen
      />
    </div>
  </div>
</template>
```

- [ ] **Step 7: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add app/utils/video.ts __tests__/utils/video.test.ts \
  app/components/blocks/display/VideoBlock.vue \
  app/components/blocks/edit/VideoBlockEdit.vue
git commit -m "feat: implement VideoBlock with YouTube/Vimeo embed support"
```

---

## Task 8: WebsitePreviewBlock

**Files:**
- Modify: `app/components/blocks/display/WebsitePreviewBlock.vue`
- Modify: `app/components/blocks/edit/WebsitePreviewBlockEdit.vue`

- [ ] **Step 1: Implement WebsitePreviewBlock display component**

Replace contents of `app/components/blocks/display/WebsitePreviewBlock.vue`:

```vue
<script setup lang="ts">
import type { WebsitePreviewBlockData } from '~/types/blocks'

defineProps<{ data: WebsitePreviewBlockData }>()

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
</script>

<template>
  <a
    v-if="data.url"
    :href="data.url"
    target="_blank"
    rel="noopener noreferrer"
    class="block overflow-hidden rounded-[var(--profile-radius,10px)] bg-[var(--profile-surface,#fff)] ring-1 ring-black/5 transition-opacity hover:opacity-90"
    :style="{ boxShadow: 'var(--profile-shadow,0 2px 12px rgba(0,0,0,0.08))' }"
  >
    <img
      v-if="data.imageUrl"
      :src="data.imageUrl"
      :alt="data.title"
      class="h-40 w-full object-cover"
    />
    <div class="p-3">
      <div
        v-if="data.title"
        class="line-clamp-2 text-sm font-semibold text-[var(--profile-text,#1a1a17)]"
      >
        {{ data.title }}
      </div>
      <div
        v-if="data.description"
        class="mt-0.5 line-clamp-2 text-xs text-[var(--profile-muted,#6b6860)]"
      >
        {{ data.description }}
      </div>
      <div class="mt-1.5 text-xs text-[var(--profile-accent,#6e8761)]">
        {{ getDomain(data.url) }}
      </div>
    </div>
  </a>
  <div
    v-else
    class="flex h-20 items-center justify-center rounded-[var(--profile-radius,10px)] bg-[var(--profile-surface,#fff)] text-sm text-[var(--profile-muted,#6b6860)]"
  >
    Add a URL to show a website preview
  </div>
</template>
```

- [ ] **Step 2: Implement WebsitePreviewBlockEdit component**

Replace contents of `app/components/blocks/edit/WebsitePreviewBlockEdit.vue`:

```vue
<script setup lang="ts">
import type { WebsitePreviewBlockData } from '~/types/blocks'

const props = defineProps<{ data: WebsitePreviewBlockData }>()
const emit = defineEmits<{ 'update:data': [data: WebsitePreviewBlockData] }>()

const localData = reactive({ ...props.data })
const fetching = ref(false)
const fetchError = ref('')

watch(localData, () => emit('update:data', { ...localData }))

async function fetchPreview() {
  if (!localData.url) return
  fetching.value = true
  fetchError.value = ''
  try {
    const result = await $fetch<{
      title: string
      description: string
      imageUrl: string
      url: string
    }>(`/api/og?url=${encodeURIComponent(localData.url)}`)
    localData.title = result.title
    localData.description = result.description
    localData.imageUrl = result.imageUrl
  } catch {
    fetchError.value = 'Could not fetch preview for this URL'
  } finally {
    fetching.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">Website URL</label>
      <div class="flex gap-2">
        <input
          v-model="localData.url"
          type="url"
          placeholder="https://example.com"
          class="min-w-0 flex-1 rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted/50 focus:border-sage-400 focus:outline-none"
        />
        <button
          type="button"
          :disabled="!localData.url || fetching"
          class="shrink-0 rounded-lg bg-sage-100 px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-200 disabled:opacity-40"
          @click="fetchPreview"
        >
          {{ fetching ? 'Fetching…' : 'Fetch preview' }}
        </button>
      </div>
      <p v-if="fetchError" class="mt-1 text-xs text-red-500">{{ fetchError }}</p>
    </div>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">Title</label>
      <input
        v-model="localData.title"
        type="text"
        class="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text focus:border-sage-400 focus:outline-none"
      />
    </div>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">Description</label>
      <textarea
        v-model="localData.description"
        rows="2"
        class="w-full resize-none rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text focus:border-sage-400 focus:outline-none"
      />
    </div>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">
        Preview image URL
      </label>
      <input
        v-model="localData.imageUrl"
        type="url"
        class="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text focus:border-sage-400 focus:outline-none"
      />
    </div>
    <!-- Live preview -->
    <div v-if="localData.url" class="overflow-hidden rounded-lg ring-1 ring-warm-border">
      <img
        v-if="localData.imageUrl"
        :src="localData.imageUrl"
        alt="Preview"
        class="h-32 w-full object-cover"
      />
      <div class="bg-warm-card p-3">
        <div
          v-if="localData.title"
          class="line-clamp-1 text-sm font-semibold text-warm-text"
        >
          {{ localData.title }}
        </div>
        <div
          v-if="localData.description"
          class="mt-0.5 line-clamp-1 text-xs text-warm-muted"
        >
          {{ localData.description }}
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/blocks/display/WebsitePreviewBlock.vue \
  app/components/blocks/edit/WebsitePreviewBlockEdit.vue
git commit -m "feat: implement WebsitePreviewBlock with OG metadata fetch"
```

---

## Task 9: PhotoSingleBlock

**Files:**
- Modify: `app/components/blocks/display/PhotoSingleBlock.vue`
- Modify: `app/components/blocks/edit/PhotoSingleBlockEdit.vue`

- [ ] **Step 1: Implement PhotoSingleBlock display component**

Replace contents of `app/components/blocks/display/PhotoSingleBlock.vue`:

```vue
<script setup lang="ts">
import type { PhotoSingleBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoSingleBlockData }>()
const config = useRuntimeConfig()

const imageUrl = computed(() => {
  if (!props.data.storageKey) return null
  const base = (config.public.storagePublicUrl as string).replace(/\/$/, '')
  return `${base}/${props.data.storageKey}`
})
</script>

<template>
  <div>
    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt="Photo"
      class="w-full rounded-[var(--profile-radius,10px)] object-cover"
      style="max-height: 480px"
    />
    <div
      v-else
      class="flex h-48 items-center justify-center rounded-[var(--profile-radius,10px)] bg-[var(--profile-surface,#fff)] text-sm text-[var(--profile-muted,#6b6860)]"
    >
      🖼️ No photo yet
    </div>
    <p
      v-if="data.caption"
      class="mt-2 text-center text-sm italic text-[var(--profile-muted,#6b6860)]"
    >
      {{ data.caption }}
    </p>
  </div>
</template>
```

- [ ] **Step 2: Implement PhotoSingleBlockEdit component**

Replace contents of `app/components/blocks/edit/PhotoSingleBlockEdit.vue`:

```vue
<script setup lang="ts">
import type { PhotoSingleBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoSingleBlockData }>()
const emit = defineEmits<{ 'update:data': [data: PhotoSingleBlockData] }>()

const { upload, remove, uploading, error, getPhotoUrl } = usePhotoUpload()
const localData = reactive({ ...props.data })
const fileInput = ref<HTMLInputElement | null>(null)

const imageUrl = computed(() =>
  localData.storageKey ? getPhotoUrl(localData.storageKey) : null,
)

watch(localData, () => emit('update:data', { ...localData }))

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (localData.photoId) {
    await remove(localData.photoId)
  }
  const result = await upload(file)
  localData.photoId = result.id
  localData.storageKey = result.storageKey
}

async function removePhoto() {
  if (localData.photoId) {
    await remove(localData.photoId)
  }
  localData.photoId = ''
  localData.storageKey = ''
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <div v-if="imageUrl" class="relative overflow-hidden rounded-xl">
        <img :src="imageUrl" alt="Preview" class="h-56 w-full object-cover" />
        <button
          type="button"
          class="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          @click="removePhoto"
        >
          <span class="text-xs leading-none">✕</span>
        </button>
      </div>
      <button
        v-else
        type="button"
        :disabled="uploading"
        class="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-warm-border bg-warm-bg text-sm text-warm-muted hover:border-sage-400 disabled:opacity-50"
        @click="fileInput?.click()"
      >
        <span class="text-2xl">🖼️</span>
        <span>{{ uploading ? 'Uploading…' : 'Click to upload a photo' }}</span>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="onFileChange"
      />
      <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
    </div>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">
        Caption (optional)
      </label>
      <input
        v-model="localData.caption"
        type="text"
        placeholder="Add a caption…"
        class="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted/50 focus:border-sage-400 focus:outline-none"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/blocks/display/PhotoSingleBlock.vue \
  app/components/blocks/edit/PhotoSingleBlockEdit.vue
git commit -m "feat: implement PhotoSingleBlock with upload, preview, and caption"
```

---

## Task 10: PhotoCarouselBlock

**Files:**
- Modify: `app/components/blocks/display/PhotoCarouselBlock.vue`
- Modify: `app/components/blocks/edit/PhotoCarouselBlockEdit.vue`

- [ ] **Step 1: Implement PhotoCarouselBlock display component**

Replace contents of `app/components/blocks/display/PhotoCarouselBlock.vue`:

```vue
<script setup lang="ts">
import type { PhotoCarouselBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoCarouselBlockData }>()
const config = useRuntimeConfig()

function photoUrl(storageKey: string): string {
  const base = (config.public.storagePublicUrl as string).replace(/\/$/, '')
  return `${base}/${storageKey}`
}
</script>

<template>
  <div>
    <div
      v-if="data.photos.length"
      class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
    >
      <div
        v-for="photo in data.photos"
        :key="photo.id"
        class="shrink-0 snap-start overflow-hidden rounded-[var(--profile-radius,10px)]"
        style="width: 80%; max-width: 320px"
      >
        <img
          :src="photoUrl(photo.storageKey)"
          alt="Photo"
          class="h-56 w-full object-cover"
        />
      </div>
    </div>
    <div
      v-else
      class="flex h-48 items-center justify-center rounded-[var(--profile-radius,10px)] bg-[var(--profile-surface,#fff)] text-sm text-[var(--profile-muted,#6b6860)]"
    >
      🎠 No photos yet
    </div>
  </div>
</template>
```

- [ ] **Step 2: Implement PhotoCarouselBlockEdit component**

Replace contents of `app/components/blocks/edit/PhotoCarouselBlockEdit.vue`:

```vue
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { PhotoCarouselBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoCarouselBlockData }>()
const emit = defineEmits<{ 'update:data': [data: PhotoCarouselBlockData] }>()

const { upload, remove, uploading, error, getPhotoUrl } = usePhotoUpload()
const photos = ref(props.data.photos.map((p) => ({ ...p })))
const fileInput = ref<HTMLInputElement | null>(null)

watch(photos, () => emit('update:data', { photos: photos.value.map((p) => ({ ...p })) }), {
  deep: true,
})

async function onFilesChange(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  for (const file of files) {
    const result = await upload(file)
    photos.value.push({ id: result.id, storageKey: result.storageKey })
  }
  if (fileInput.value) fileInput.value.value = ''
}

async function removePhoto(index: number) {
  const photo = photos.value[index]
  await remove(photo.id)
  photos.value.splice(index, 1)
}
</script>

<template>
  <div class="space-y-4">
    <VueDraggable
      v-model="photos"
      handle=".drag-handle"
      class="space-y-2"
    >
      <div
        v-for="(photo, i) in photos"
        :key="photo.id"
        class="flex items-center gap-3 rounded-xl border border-warm-border bg-warm-card p-2"
      >
        <span class="drag-handle cursor-grab select-none text-warm-muted">⠿</span>
        <img
          :src="getPhotoUrl(photo.storageKey)"
          alt=""
          class="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
        <span class="flex-1 truncate text-xs text-warm-muted">Photo {{ i + 1 }}</span>
        <button
          type="button"
          class="shrink-0 text-sm text-warm-muted hover:text-red-500"
          @click="removePhoto(i)"
        >
          ✕
        </button>
      </div>
    </VueDraggable>

    <button
      type="button"
      :disabled="uploading"
      class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-warm-border bg-warm-bg py-3 text-sm text-warm-muted hover:border-sage-400 disabled:opacity-50"
      @click="fileInput?.click()"
    >
      {{ uploading ? 'Uploading…' : '+ Add photos' }}
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      multiple
      class="hidden"
      @change="onFilesChange"
    />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/blocks/display/PhotoCarouselBlock.vue \
  app/components/blocks/edit/PhotoCarouselBlockEdit.vue
git commit -m "feat: implement PhotoCarouselBlock with multi-upload and drag reorder"
```

---

## Task 11: SocialLinksBlock

**Files:**
- Modify: `app/components/blocks/display/SocialLinksBlock.vue`
- Modify: `app/components/blocks/edit/SocialLinksBlockEdit.vue`

- [ ] **Step 1: Implement SocialLinksBlock display component**

Replace contents of `app/components/blocks/display/SocialLinksBlock.vue`:

```vue
<script setup lang="ts">
import type { SocialLinksBlockData, SocialPlatform } from '~/types/blocks'

defineProps<{ data: SocialLinksBlockData }>()

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  website: 'Website',
  other: 'Link',
}

const PLATFORM_ICONS: Record<SocialPlatform, string> = {
  instagram: '📷',
  spotify: '🎵',
  linkedin: '💼',
  twitter: '🐦',
  tiktok: '🎬',
  youtube: '▶️',
  website: '🌐',
  other: '🔗',
}
</script>

<template>
  <div>
    <div
      class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]"
    >
      Links
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        v-for="link in data.links.filter((l) => l.isVisible && l.url)"
        :key="link.platform"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 rounded-full bg-[var(--profile-surface,#fff)] px-3 py-1.5 text-sm text-[var(--profile-text,#1a1a17)] ring-1 ring-black/5 transition-opacity hover:opacity-75"
      >
        <span>{{ PLATFORM_ICONS[link.platform] }}</span>
        <span>{{ link.label || PLATFORM_LABELS[link.platform] }}</span>
      </a>
      <p
        v-if="!data.links.some((l) => l.isVisible && l.url)"
        class="text-sm italic text-[var(--profile-muted,#6b6860)]"
      >
        No links visible yet
      </p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Implement SocialLinksBlockEdit component**

Replace contents of `app/components/blocks/edit/SocialLinksBlockEdit.vue`:

```vue
<script setup lang="ts">
import type { SocialLinksBlockData, SocialLink, SocialPlatform } from '~/types/blocks'

const props = defineProps<{ data: SocialLinksBlockData }>()
const emit = defineEmits<{ 'update:data': [data: SocialLinksBlockData] }>()

const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'spotify', 'linkedin', 'twitter', 'tiktok', 'youtube', 'website', 'other',
]

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  website: 'Website',
  other: 'Other',
}

// Ensure all platforms have an entry (handles both empty initial data and partial data)
const links = ref<SocialLink[]>(
  ALL_PLATFORMS.map((platform) => {
    const existing = props.data.links.find((l) => l.platform === platform)
    return existing ?? { platform, url: '', label: '', isVisible: false }
  }),
)

watch(
  links,
  () => emit('update:data', { links: links.value.map((l) => ({ ...l })) }),
  { deep: true },
)
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-warm-muted">
      Toggle links on to show them on your profile.
    </p>
    <div
      v-for="link in links"
      :key="link.platform"
      class="rounded-xl border border-warm-border bg-warm-card p-3"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-warm-text">
          {{ PLATFORM_LABELS[link.platform] }}
        </span>
        <!-- Toggle switch -->
        <button
          type="button"
          :class="[
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            link.isVisible ? 'bg-sage-500' : 'bg-warm-border',
          ]"
          @click="link.isVisible = !link.isVisible"
        >
          <span
            :class="[
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
              link.isVisible ? 'translate-x-4' : 'translate-x-0',
            ]"
          />
        </button>
      </div>
      <input
        v-if="link.isVisible"
        v-model="link.url"
        type="url"
        :placeholder="`Your ${PLATFORM_LABELS[link.platform]} URL`"
        class="mt-2 w-full rounded-lg border border-warm-border bg-warm-bg px-3 py-1.5 text-sm text-warm-text placeholder:text-warm-muted/50 focus:border-sage-400 focus:outline-none"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/blocks/display/SocialLinksBlock.vue \
  app/components/blocks/edit/SocialLinksBlockEdit.vue
git commit -m "feat: implement SocialLinksBlock with per-platform toggle and URL input"
```

---

## Task 12: ContactButtonBlock

**Files:**
- Modify: `app/components/blocks/display/ContactButtonBlock.vue`
- Modify: `app/components/blocks/edit/ContactButtonBlockEdit.vue`

- [ ] **Step 1: Implement ContactButtonBlock display component**

Replace contents of `app/components/blocks/display/ContactButtonBlock.vue`:

```vue
<script setup lang="ts">
import type { ContactButtonBlockData } from '~/types/blocks'

defineProps<{ data: ContactButtonBlockData }>()
</script>

<template>
  <div class="flex justify-center">
    <button
      type="button"
      class="rounded-[var(--profile-radius,10px)] bg-[var(--profile-accent,#6e8761)] px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      {{ data.label || 'Get in touch' }}
    </button>
  </div>
</template>
```

- [ ] **Step 2: Implement ContactButtonBlockEdit component**

Replace contents of `app/components/blocks/edit/ContactButtonBlockEdit.vue`:

```vue
<script setup lang="ts">
import type { ContactButtonBlockData } from '~/types/blocks'

const props = defineProps<{ data: ContactButtonBlockData }>()
const emit = defineEmits<{ 'update:data': [data: ContactButtonBlockData] }>()

const label = ref(props.data.label)

watch(label, () => emit('update:data', { label: label.value }))
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1.5 block text-xs font-medium text-warm-muted">
        Button label
      </label>
      <input
        v-model="label"
        type="text"
        placeholder="Get in touch"
        maxlength="40"
        class="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted/50 focus:border-sage-400 focus:outline-none"
      />
      <p class="mt-1 text-right text-xs text-warm-muted">{{ label.length }}/40</p>
    </div>
    <p class="rounded-lg bg-warm-bg p-3 text-xs text-warm-muted">
      The contact form will be wired up in Phase 6. For now this shows the button UI on your profile.
    </p>
    <!-- Live preview -->
    <div class="flex justify-center">
      <button
        type="button"
        class="rounded-lg bg-sage-500 px-8 py-3 text-sm font-semibold text-white"
      >
        {{ label || 'Get in touch' }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/blocks/display/ContactButtonBlock.vue \
  app/components/blocks/edit/ContactButtonBlockEdit.vue
git commit -m "feat: implement ContactButtonBlock (contact form wired in Phase 6)"
```

---

## Task 13: Full ThemeSidebar Editor

**Files:**
- Modify: `app/components/editor/ThemeSidebar.vue`

- [ ] **Step 1: Replace ThemeSidebar stub with full editor**

Replace the entire contents of `app/components/editor/ThemeSidebar.vue`:

```vue
<script setup lang="ts">
import {
  THEME_PRESETS,
  type Theme,
  type ThemePresetName,
  type BorderRadius,
  type Shadow,
} from '~/types/theme'

const props = defineProps<{ theme: Theme }>()
const emit = defineEmits<{ 'update:theme': [theme: Theme] }>()

const presetNames = Object.keys(THEME_PRESETS) as ThemePresetName[]

const presetLabels: Record<ThemePresetName, string> = {
  'sage-linen': 'Sage & Linen',
  midnight: 'Midnight',
  blossom: 'Blossom',
  bold: 'Bold',
  'golden-hour': 'Golden Hour',
  paper: 'Paper',
}

const FONTS = [
  'DM Sans',
  'Inter',
  'Playfair Display',
  'Bebas Neue',
  'Lato',
  'Merriweather',
  'IBM Plex Mono',
]

const COLOR_FIELDS: Array<{ key: 'backgroundColor' | 'surfaceColor' | 'textColor' | 'accentColor'; label: string }> = [
  { key: 'backgroundColor', label: 'Background' },
  { key: 'surfaceColor', label: 'Surface' },
  { key: 'textColor', label: 'Text' },
  { key: 'accentColor', label: 'Accent' },
]

const RADIUS_OPTIONS: Array<{ value: BorderRadius; label: string }> = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'soft', label: 'Soft' },
  { value: 'round', label: 'Round' },
]

const SHADOW_OPTIONS: Array<{ value: Shadow; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'lifted', label: 'Lifted' },
]

function selectPreset(name: ThemePresetName) {
  emit('update:theme', { preset: name, ...THEME_PRESETS[name] })
}

function updateColor(
  key: 'backgroundColor' | 'surfaceColor' | 'textColor' | 'accentColor',
  value: string,
) {
  emit('update:theme', { ...props.theme, preset: 'custom', [key]: value })
}

function updateFont(key: 'headingFont' | 'bodyFont', value: string) {
  emit('update:theme', { ...props.theme, preset: 'custom', [key]: value })
}

function updateRadius(value: BorderRadius) {
  emit('update:theme', { ...props.theme, preset: 'custom', borderRadius: value })
}

function updateShadow(value: Shadow) {
  emit('update:theme', { ...props.theme, preset: 'custom', shadow: value })
}

function resetToPreset() {
  if (props.theme.preset !== 'custom') {
    const name = props.theme.preset as ThemePresetName
    emit('update:theme', { preset: name, ...THEME_PRESETS[name] })
  }
}
</script>

<template>
  <aside class="flex h-full w-64 shrink-0 flex-col border-l border-warm-border bg-warm-card">
    <!-- Header -->
    <div class="border-b border-warm-border px-4 py-3">
      <h2 class="text-sm font-semibold text-warm-text">Theme</h2>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Presets -->
      <div class="border-b border-warm-border p-4">
        <p class="mb-3 text-xs font-medium text-warm-muted">Presets</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="name in presetNames"
            :key="name"
            :class="[
              'rounded-xl border-2 p-3 text-left transition-all',
              theme.preset === name
                ? 'border-sage-500'
                : 'border-transparent hover:border-warm-border',
            ]"
            :style="{ backgroundColor: THEME_PRESETS[name].backgroundColor }"
            @click="selectPreset(name)"
          >
            <div class="mb-2 flex gap-0.5">
              <div
                class="h-2 w-3 rounded-sm"
                :style="{ backgroundColor: THEME_PRESETS[name].accentColor }"
              />
              <div
                class="h-2 w-3 rounded-sm"
                :style="{ backgroundColor: THEME_PRESETS[name].surfaceColor }"
              />
              <div
                class="h-2 w-3 rounded-sm"
                :style="{ backgroundColor: THEME_PRESETS[name].textColor }"
              />
            </div>
            <div
              class="text-xs font-medium"
              :style="{ color: THEME_PRESETS[name].textColor }"
            >
              {{ presetLabels[name] }}
            </div>
          </button>
        </div>
        <button
          v-if="theme.preset !== 'custom'"
          type="button"
          class="mt-2 w-full rounded-lg py-1.5 text-xs text-warm-muted hover:text-warm-text"
          @click="resetToPreset"
        >
          Reset to {{ presetLabels[theme.preset as ThemePresetName] }} defaults
        </button>
      </div>

      <!-- Colors -->
      <div class="border-b border-warm-border p-4">
        <p class="mb-3 text-xs font-medium text-warm-muted">Colors</p>
        <div class="space-y-3">
          <div
            v-for="field in COLOR_FIELDS"
            :key="field.key"
            class="flex items-center justify-between"
          >
            <span class="text-xs text-warm-text">{{ field.label }}</span>
            <div class="flex items-center gap-1.5">
              <input
                type="color"
                :value="theme[field.key]"
                class="h-7 w-7 cursor-pointer rounded border border-warm-border p-0.5"
                @input="updateColor(field.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                :value="theme[field.key]"
                maxlength="7"
                class="w-20 rounded border border-warm-border bg-warm-bg px-2 py-1 font-mono text-xs text-warm-text focus:border-sage-400 focus:outline-none"
                @change="updateColor(field.key, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Fonts -->
      <div class="border-b border-warm-border p-4">
        <p class="mb-3 text-xs font-medium text-warm-muted">Fonts</p>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs text-warm-text">Heading</label>
            <select
              :value="theme.headingFont"
              class="w-full rounded-lg border border-warm-border bg-warm-card px-2 py-1.5 text-sm text-warm-text focus:border-sage-400 focus:outline-none"
              @change="updateFont('headingFont', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="font in FONTS" :key="font" :value="font">
                {{ font }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-warm-text">Body</label>
            <select
              :value="theme.bodyFont"
              class="w-full rounded-lg border border-warm-border bg-warm-card px-2 py-1.5 text-sm text-warm-text focus:border-sage-400 focus:outline-none"
              @change="updateFont('bodyFont', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="font in FONTS" :key="font" :value="font">
                {{ font }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Border radius -->
      <div class="border-b border-warm-border p-4">
        <p class="mb-3 text-xs font-medium text-warm-muted">Corner radius</p>
        <div class="flex gap-2">
          <button
            v-for="opt in RADIUS_OPTIONS"
            :key="opt.value"
            type="button"
            :class="[
              'flex-1 rounded-lg border py-1.5 text-xs transition-colors',
              theme.borderRadius === opt.value
                ? 'border-sage-500 bg-sage-50 text-sage-700'
                : 'border-warm-border text-warm-muted hover:border-sage-400',
            ]"
            @click="updateRadius(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Shadow -->
      <div class="p-4">
        <p class="mb-3 text-xs font-medium text-warm-muted">Shadow</p>
        <div class="flex gap-2">
          <button
            v-for="opt in SHADOW_OPTIONS"
            :key="opt.value"
            type="button"
            :class="[
              'flex-1 rounded-lg border py-1.5 text-xs transition-colors',
              theme.shadow === opt.value
                ? 'border-sage-500 bg-sage-50 text-sage-700'
                : 'border-warm-border text-warm-muted hover:border-sage-400',
            ]"
            @click="updateShadow(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/editor/ThemeSidebar.vue
git commit -m "feat: implement full ThemeSidebar — color pickers, font dropdowns, radius and shadow toggles"
```

---

## Task 14: Playwright Verification

Make sure the dev server is running (`npm run dev`) and Docker services are up before these steps.

- [ ] **Step 1: Navigate to dashboard and sign in**

Use Playwright MCP to navigate to `http://localhost:3000`. Sign in with a test account and confirm the redirect to `/dashboard`.

- [ ] **Step 2: Verify VideoBlock**

- Open block picker → select "Video"
- In the edit popup, enter `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Confirm an iframe preview renders inside the popup (no error message)
- Close popup → confirm canvas shows the block with an iframe, not the old "▶️ Video — coming soon" placeholder

- [ ] **Step 3: Verify SocialLinksBlock**

- Open block picker → select "Social Links"
- Confirm all 8 platforms render with toggle switches
- Toggle Instagram on → enter `https://instagram.com/test`
- Close popup → confirm canvas shows an Instagram badge link

- [ ] **Step 4: Verify ContactButtonBlock**

- Open block picker → select "Contact Button"
- Change label to "Say hello"
- Confirm the preview button in the popup updates to "Say hello"
- Close popup → confirm canvas shows a styled "Say hello" button

- [ ] **Step 5: Verify WebsitePreviewBlock**

- Open block picker → select "Website"
- Enter `https://example.com` → click "Fetch preview"
- Confirm title field populates (or shows empty gracefully if unreachable)
- Close popup → confirm canvas shows the preview card with URL domain

- [ ] **Step 6: Verify PhotoSingleBlock** (requires MinIO running)

- Open block picker → select "Photo"
- Confirm the dashed upload area renders (not "coming soon" text)
- Upload a small test image file
- Confirm the image preview appears inside the popup
- Close popup → confirm canvas shows the photo
- Optionally add a caption and confirm it displays below the image

- [ ] **Step 7: Verify ThemeSidebar full editor**

- Open the theme sidebar
- Confirm color pickers appear for Background, Surface, Text, Accent (with hex inputs)
- Confirm Heading and Body font dropdowns list the 7 font options
- Confirm Sharp/Soft/Round corner radius buttons are present
- Confirm Flat/Lifted shadow buttons are present
- Change accent color via the color picker → confirm the canvas updates live
- Switch to "Midnight" preset → confirm all values reset to midnight values

- [ ] **Step 8: Check console for errors**

Use `mcp__plugin_playwright_playwright__browser_console_messages` to verify there are no console errors or Vue warnings.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: Phase 4b complete — all blocks and full theme editor verified via Playwright"
```

---

## All tests passing check

```bash
npm test
```

Expected: All tests in `__tests__/` pass (storage, og, video — 10 tests total).
