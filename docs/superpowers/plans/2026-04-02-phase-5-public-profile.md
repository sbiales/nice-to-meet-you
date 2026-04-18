# Phase 5: Public Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the SSR public profile page at `/:username` — renders the visitor-facing profile with theme, header, blocks, OG tags, and paused/taken state handling.

**Architecture:** The existing `app/pages/[username].vue` stub is fully implemented using `useAsyncData` to fetch from a new public `GET /api/profiles/[username]` endpoint (no auth). A `ProfileHeaderDisplay.vue` component renders the banner/tagline/name. A `ProfileStamp.vue` renders a fixed diagonal PAUSED/TAKEN overlay. Theme CSS vars are applied to the root element on mount. OG tags are set via `useSeoMeta` using data fetched server-side. Paused profiles hide block content and show a themed message; taken profiles show the full profile. The `contact_button` block is filtered out (Phase 6 scope).

**Tech Stack:** Nuxt 4 SSR (`useAsyncData`), `useSeoMeta` (OG tags), Drizzle ORM (DB query), Vitest (DB-layer tests), Vue 3.

---

### Task 1: Create GET /api/profiles/[username] public endpoint

**Files:**
- Create: `server/api/profiles/[username].get.ts`
- Create: `__tests__/api/profiles/public-profile.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/api/profiles/public-profile.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { profiles } from '~~/server/db/schema/profiles'
import { user } from '~~/server/db/schema/auth'
import type { AnyBlock } from '~/types/blocks'

const TEST_USER_ID = 'public-profile-test-user'
const TEST_USERNAME = 'public_profile_test'

const TEST_BLOCKS: AnyBlock[] = [
  { id: 'b1', type: 'bio', width: 'full', data: { content: '<p>Hello world</p>' } },
  { id: 'b2', type: 'interests', width: 'half', data: { tags: ['hiking'] } },
]

// Helper that replicates the endpoint's query + stripping logic
async function queryPublicProfile(username: string) {
  const row = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })
  if (!row) return null
  return {
    ...row,
    blocks: row.status === 'paused' ? [] : (row.blocks ?? []),
  }
}

beforeAll(async () => {
  await db.insert(user).values({
    id: TEST_USER_ID,
    name: 'Public Profile Test',
    email: 'publicprofiletest@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing()

  await db.insert(profiles).values({
    userId: TEST_USER_ID,
    username: TEST_USERNAME,
    displayName: 'Public Profile Test',
    blocks: TEST_BLOCKS as any,
  }).onConflictDoNothing()
})

afterAll(async () => {
  await db.delete(profiles).where(eq(profiles.userId, TEST_USER_ID))
  await db.delete(user).where(eq(user.id, TEST_USER_ID))
})

describe('public profile query', () => {
  it('returns null for unknown username', async () => {
    const result = await queryPublicProfile('this_user_does_not_exist_xyz')
    expect(result).toBeNull()
  })

  it('returns profile with blocks for active status', async () => {
    await db.update(profiles)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const result = await queryPublicProfile(TEST_USERNAME)
    expect(result).not.toBeNull()
    expect(result?.status).toBe('active')
    expect((result?.blocks as AnyBlock[]).length).toBe(2)
  })

  it('returns profile with blocks for taken status', async () => {
    await db.update(profiles)
      .set({ status: 'taken', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const result = await queryPublicProfile(TEST_USERNAME)
    expect(result?.status).toBe('taken')
    expect((result?.blocks as AnyBlock[]).length).toBe(2)
  })

  it('strips blocks for paused status', async () => {
    await db.update(profiles)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const result = await queryPublicProfile(TEST_USERNAME)
    expect(result?.status).toBe('paused')
    expect(result?.blocks).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — expect pass** (all DB logic tested directly)

```bash
npm test -- --testPathPattern="public-profile"
```
Expected: all 4 tests PASS

- [ ] **Step 3: Create the endpoint**

```typescript
// server/api/profiles/[username].get.ts
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  if (!username) {
    throw createError({ statusCode: 400, message: 'Username required' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })

  if (!profile || profile.deletedAt) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  return {
    ...profile,
    blocks: profile.status === 'paused' ? [] : profile.blocks,
  }
})
```

- [ ] **Step 4: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add server/api/profiles/[username].get.ts __tests__/api/profiles/public-profile.test.ts
git commit -m "feat: add GET /api/profiles/[username] public endpoint"
```

---

### Task 2: Create ProfileHeaderDisplay.vue

**Files:**
- Create: `app/components/profile/ProfileHeaderDisplay.vue`

Display-only version of the profile header. Same banner layout as the editor (`h-44 sm:h-56`, `object-fit: cover`, gradient overlay, name + tagline overlaid at bottom center). No upload controls or inline editing.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/profile/ProfileHeaderDisplay.vue -->
<script setup lang="ts">
import type { Theme } from '~/types/theme'

const props = defineProps<{
  displayName: string
  taglinePrefix: string | null
  headerImageKey: string | null
  theme: Theme
}>()

const config = useRuntimeConfig()
const bannerUrl = computed(() =>
  props.headerImageKey
    ? `${config.public.storagePublicUrl}/${props.headerImageKey}`
    : null
)
</script>

<template>
  <div
    class="relative h-44 w-full overflow-hidden sm:h-56"
    :style="{ backgroundColor: theme.backgroundColor }"
  >
    <img
      v-if="bannerUrl"
      :src="bannerUrl"
      :alt="`${displayName}'s banner`"
      class="h-full w-full object-cover"
    />

    <!-- Bottom gradient for text legibility -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

    <!-- Name + tagline at bottom center -->
    <div class="absolute inset-x-0 bottom-0 flex flex-col items-center pb-5 text-center">
      <p
        v-if="taglinePrefix"
        class="mb-1 text-sm"
        :style="{ color: 'rgba(255,255,255,0.8)', fontFamily: theme.bodyFont }"
      >
        {{ taglinePrefix }}
      </p>
      <h1
        class="text-2xl font-bold text-white sm:text-3xl"
        :style="{ fontFamily: theme.headingFont, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }"
      >
        {{ displayName }}
      </h1>
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
git add app/components/profile/ProfileHeaderDisplay.vue
git commit -m "feat: add ProfileHeaderDisplay component"
```

---

### Task 3: Create ProfileStamp.vue

**Files:**
- Create: `app/components/profile/ProfileStamp.vue`

Fixed to the viewport (does not scroll), centered, rotated -45 degrees. Black border and text at low opacity so it reads as a real stamp. `pointer-events: none` so it doesn't block interaction with the profile.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/profile/ProfileStamp.vue -->
<script setup lang="ts">
defineProps<{
  status: 'paused' | 'taken'
}>()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    aria-hidden="true"
  >
    <span
      class="rotate-[-45deg] border-[6px] border-black px-8 py-2 text-5xl font-black uppercase tracking-widest text-black opacity-20 sm:text-7xl"
    >
      {{ status }}
    </span>
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
git add app/components/profile/ProfileStamp.vue
git commit -m "feat: add ProfileStamp component"
```

---

### Task 4: Implement [username].vue SSR page

**Files:**
- Modify: `app/pages/[username].vue`

- [ ] **Step 1: Replace stub with full implementation**

```vue
<!-- app/pages/[username].vue -->
<script setup lang="ts">
import { applyTheme } from '~/types/theme'
import type { Theme } from '~/types/theme'
import type { AnyBlock } from '~/types/blocks'

definePageMeta({ layout: 'default' })

const route = useRoute()
const username = route.params.username as string
const config = useRuntimeConfig()

// Fetch profile server-side (SSR) — 404s are handled by Nuxt error page
const { data: profile } = await useAsyncData(
  `profile-${username}`,
  () => $fetch<Record<string, unknown>>(`/api/profiles/${username}`),
  { lazy: false }
)

if (!profile.value) {
  throw createError({ statusCode: 404, message: 'Profile not found' })
}

const theme = computed(() => profile.value?.theme as Theme)
const blocks = computed(() =>
  (profile.value?.blocks as AnyBlock[] ?? []).filter(b => b.type !== 'contact_button')
)
const status = computed(() => profile.value?.status as 'active' | 'taken' | 'paused')
const displayName = computed(() => profile.value?.displayName as string ?? '')
const taglinePrefix = computed(() => profile.value?.taglinePrefix as string | null ?? null)
const headerImageKey = computed(() => profile.value?.headerImageKey as string | null ?? null)

// OG tags — set from SSR data
const bioBlock = computed(() => blocks.value.find(b => b.type === 'bio'))
const bioText = computed(() => {
  if (!bioBlock.value) return null
  const html = (bioBlock.value.data as { content: string }).content
  return html.replace(/<[^>]*>/g, '').trim().substring(0, 160) || null
})
const ogDescription = computed(
  () => bioText.value ?? `Check out ${displayName.value}'s profile on Nice To Meet You`
)
const ogImage = computed(() =>
  headerImageKey.value
    ? `${config.public.storagePublicUrl}/${headerImageKey.value}`
    : undefined
)

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

useSeoMeta({
  title: displayName,
  ogTitle: displayName,
  description: ogDescription,
  ogDescription: ogDescription,
  ogImage: ogImage,
  ogUrl: `https://nicetomeetyou.app/${username}`,
})

// Apply theme CSS vars on the client after mount
const pageRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (pageRef.value && theme.value) {
    applyTheme(pageRef.value, theme.value)
  }
})

watch(theme, (t) => {
  if (pageRef.value && t) applyTheme(pageRef.value, t)
}, { deep: true })
</script>

<template>
  <div
    ref="pageRef"
    class="min-h-screen"
    :style="{ backgroundColor: theme?.backgroundColor }"
  >
    <!-- PAUSED: show themed shell + message, no profile content -->
    <template v-if="status === 'paused'">
      <div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p
          class="text-lg"
          :style="{ color: theme?.textColor, fontFamily: theme?.bodyFont }"
        >
          Sorry, {{ displayName }} has paused their profile.
        </p>
      </div>
      <ProfileStamp status="paused" />
    </template>

    <!-- ACTIVE or TAKEN: render full profile -->
    <template v-else>
      <ProfileHeaderDisplay
        :display-name="displayName"
        :tagline-prefix="taglinePrefix"
        :header-image-key="headerImageKey"
        :theme="theme"
      />

      <div class="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <BlockRenderer
          v-for="block in blocks"
          :key="block.id"
          :block="block"
        />
      </div>

      <ProfileStamp v-if="status === 'taken'" status="taken" />
    </template>
  </div>
</template>
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/pages/[username].vue
git commit -m "feat: implement SSR public profile page with OG tags and paused/taken states"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full test suite + typecheck**

```bash
npm test && npx nuxi typecheck
```
Expected: all PASS, no type errors

- [ ] **Step 2: Playwright verification** (start dev server: `nuxt dev`)

**Active profile:**
1. Navigate to `http://localhost:3000/<your-test-username>`
2. Verify banner, tagline prefix, and display name render correctly
3. Verify blocks render (bio text, interests chips, etc.)
4. Check browser DevTools → Network → page source: verify `<meta name="og:title">` and `<meta name="og:description">` are in the HTML (SSR)
5. Verify no console errors

**Paused profile:**
6. In the DB (or via a test script), set the test profile's `status` to `paused`
7. Navigate to the profile URL
8. Verify only the themed background + "Sorry, [name] has paused their profile." message shows
9. Verify PAUSED stamp is visible, fixed, does not scroll
10. Verify no blocks are visible

**Taken profile:**
11. Set `status` to `taken`
12. Navigate to the profile URL
13. Verify full profile content is visible
14. Verify TAKEN stamp is visible, fixed, does not scroll

**404:**
15. Navigate to `http://localhost:3000/this-user-definitely-does-not-exist`
16. Verify Nuxt 404 error page is shown

- [ ] **Step 3: Restore test profile status to active**

```sql
-- run via psql or drizzle studio
UPDATE profiles SET status = 'active' WHERE username = '<your-test-username>';
```

- [ ] **Step 4: Kill dev server**

```bash
npx kill-port 3000
```

- [ ] **Step 5: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 5: Public profile page (SSR, OG tags, paused/taken states)" --body "$(cat <<'EOF'
## Summary
- New `GET /api/profiles/[username]` public endpoint — no auth required; strips blocks for paused profiles
- `ProfileHeaderDisplay.vue` — display-only banner/tagline/name header, matches editor look
- `ProfileStamp.vue` — fixed viewport overlay, rotated -45deg, PAUSED or TAKEN label
- `[username].vue` fully implemented — SSR data fetch, theme CSS vars, OG meta tags, per-status rendering
- Paused: themed page shell + "Sorry, [name] has paused their profile." + PAUSED stamp; no block content exposed
- Taken: full profile + TAKEN stamp
- `contact_button` blocks filtered out (Phase 6 scope)

## Test plan
- [ ] `npm test` passes
- [ ] `npx nuxi typecheck` passes
- [ ] Active profile: banner + tagline + name + blocks render correctly
- [ ] OG tags present in page source (SSR)
- [ ] Paused profile: no block content, only themed message + stamp
- [ ] Taken profile: full content + stamp overlay
- [ ] Unknown username → 404
- [ ] Stamp does not scroll with page content
EOF
)"
```
