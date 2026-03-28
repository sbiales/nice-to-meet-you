# Phase 2: Onboarding Flow + Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the post-signup onboarding flow (username + display name → creates profile row) and replace the placeholder homepage with a production-grade marketing landing page.

**Architecture:** Two independent pieces. Onboarding: route middleware guards `/dashboard`, `/onboarding` page creates the profiles row via a REST API, username availability is checked via a debounced GET endpoint. Landing page: prerendered static page at `/`, self-contained with its own nav, no backend dependency. Both use the Phase 1 design system (sage palette, DM Sans, warm neutrals, base components).

**Tech Stack:** Nuxt 4, Vue 3 Composition API, Tailwind CSS, Drizzle ORM, Better Auth, Vitest (unit tests), Playwright (verification)

**Available tools:**
- `context7` — verify Better Auth / Drizzle / Nuxt APIs before implementing
- `commit-commands:commit` — use for all commits
- `mcp__plugin_playwright_playwright__*` — verify every page before committing
- `frontend-design:frontend-design` — use for the landing page (Task 7) to produce distinctive, production-grade UI

**⚠️ STOP AFTER TASK 8:** After all pages are Playwright-verified, stop and present screenshots for design review. Do not proceed to Phase 3 until approved.

---

## File Map

```
app/lib/
  username-validator.ts         # CREATE — pure format + reserved-word validator; used on client and server

server/api/profiles/
  me.get.ts                     # CREATE — GET /api/profiles/me (auth-gated; used by middleware)
  check-username.get.ts         # CREATE — GET /api/profiles/check-username?username=foo (public)
  index.post.ts                 # CREATE — POST /api/profiles (auth-gated; creates profile row)

app/middleware/
  profile-required.ts           # CREATE — guards /dashboard routes; redirects to /onboarding if no profile

app/pages/
  onboarding.vue                # CREATE — username + display name form; creates profile → /dashboard
  index.vue                     # MODIFY — replace palette sampler with full landing page
  signup.vue                    # MODIFY — change post-signup redirect from /dashboard → /onboarding

app/layouts/
  default.vue                   # MODIFY — change bg-white → bg-warm-bg

app/assets/css/
  main.css                      # MODIFY — add Caveat font import

tailwind.config.ts              # MODIFY — add handwriting font family

nuxt.config.ts                  # MODIFY — add /onboarding to CSR route rules

__tests__/lib/
  username-validator.test.ts    # CREATE — unit tests for the validator
```

---

## Task 1: Username Validator (TDD)

Pure validation logic — no DB, no network. Used on both client (onboarding form) and server (API endpoints).

**Files:**
- Create: `__tests__/lib/username-validator.test.ts`
- Create: `app/lib/username-validator.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/username-validator.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateUsername, usernameErrorMessage } from '~/lib/username-validator'

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('john')).toEqual({ valid: true })
    expect(validateUsername('john_doe')).toEqual({ valid: true })
    expect(validateUsername('user123')).toEqual({ valid: true })
    expect(validateUsername('abc')).toEqual({ valid: true })
    expect(validateUsername('a'.repeat(30))).toEqual({ valid: true })
  })

  it('rejects usernames shorter than 3 characters', () => {
    expect(validateUsername('')).toEqual({ valid: false, reason: 'too_short' })
    expect(validateUsername('ab')).toEqual({ valid: false, reason: 'too_short' })
  })

  it('rejects usernames longer than 30 characters', () => {
    expect(validateUsername('a'.repeat(31))).toEqual({ valid: false, reason: 'too_long' })
  })

  it('rejects uppercase letters', () => {
    expect(validateUsername('John')).toEqual({ valid: false, reason: 'invalid_chars' })
    expect(validateUsername('JOHN')).toEqual({ valid: false, reason: 'invalid_chars' })
  })

  it('rejects hyphens, spaces, and special characters', () => {
    expect(validateUsername('john-doe')).toEqual({ valid: false, reason: 'invalid_chars' })
    expect(validateUsername('john doe')).toEqual({ valid: false, reason: 'invalid_chars' })
    expect(validateUsername('john.doe')).toEqual({ valid: false, reason: 'invalid_chars' })
  })

  it('rejects reserved usernames', () => {
    expect(validateUsername('admin')).toEqual({ valid: false, reason: 'reserved' })
    expect(validateUsername('dashboard')).toEqual({ valid: false, reason: 'reserved' })
    expect(validateUsername('api')).toEqual({ valid: false, reason: 'reserved' })
    expect(validateUsername('signin')).toEqual({ valid: false, reason: 'reserved' })
  })
})

describe('usernameErrorMessage', () => {
  it('returns empty string for valid result', () => {
    expect(usernameErrorMessage({ valid: true })).toBe('')
  })

  it('returns message for too_short', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'too_short' }))
      .toContain('3 characters')
  })

  it('returns message for too_long', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'too_long' }))
      .toContain('30 characters')
  })

  it('returns message for invalid_chars', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'invalid_chars' }))
      .toContain('letters, numbers')
  })

  it('returns message for reserved', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'reserved' }))
      .toContain('not available')
  })
})
```

- [ ] **Step 2: Run the tests — expect failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '~/lib/username-validator'`

- [ ] **Step 3: Create the validator**

Create `app/lib/username-validator.ts`:

```ts
import { isReservedUsername } from './reserved-usernames'

export type UsernameValidationResult =
  | { valid: true }
  | { valid: false; reason: 'too_short' | 'too_long' | 'invalid_chars' | 'reserved' }

export function validateUsername(username: string): UsernameValidationResult {
  if (username.length < 3) return { valid: false, reason: 'too_short' }
  if (username.length > 30) return { valid: false, reason: 'too_long' }
  if (!/^[a-z0-9_]+$/.test(username)) return { valid: false, reason: 'invalid_chars' }
  if (isReservedUsername(username)) return { valid: false, reason: 'reserved' }
  return { valid: true }
}

export function usernameErrorMessage(result: UsernameValidationResult): string {
  if (result.valid) return ''
  switch (result.reason) {
    case 'too_short': return 'Username must be at least 3 characters'
    case 'too_long': return 'Username must be 30 characters or fewer'
    case 'invalid_chars': return 'Usernames can only contain lowercase letters, numbers, and underscores'
    case 'reserved': return 'That username is not available'
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

Use `commit-commands:commit`. Message: `feat: add username validator with unit tests`

---

## Task 2: Profile API Endpoints

Three thin server routes. They import the validator using relative paths (the `~` alias does not work inside `server/`).

**Files:**
- Create: `server/api/profiles/me.get.ts`
- Create: `server/api/profiles/check-username.get.ts`
- Create: `server/api/profiles/index.post.ts`

- [ ] **Step 1: Create GET /api/profiles/me**

Create `server/api/profiles/me.get.ts`:

```ts
import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'

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

  return profile
})
```

- [ ] **Step 2: Create GET /api/profiles/check-username**

Create `server/api/profiles/check-username.get.ts`:

```ts
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { validateUsername } from '../../../app/lib/username-validator'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const username = String(query.username ?? '').toLowerCase()

  const validation = validateUsername(username)
  if (!validation.valid) {
    return { available: false }
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
    columns: { id: true },
  })

  return { available: !existing }
})
```

- [ ] **Step 3: Create POST /api/profiles**

Create `server/api/profiles/index.post.ts`:

```ts
import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { validateUsername } from '../../../app/lib/username-validator'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const username = typeof body?.username === 'string' ? body.username.toLowerCase() : ''
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''

  if (!username || !displayName) {
    throw createError({ statusCode: 400, message: 'username and displayName are required' })
  }

  const usernameValidation = validateUsername(username)
  if (!usernameValidation.valid) {
    throw createError({ statusCode: 400, message: 'Invalid username format' })
  }

  if (displayName.length > 60) {
    throw createError({ statusCode: 400, message: 'Display name must be 60 characters or fewer' })
  }

  // Prevent duplicate profile for this user
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { id: true },
  })
  if (existingProfile) {
    throw createError({ statusCode: 409, message: 'Profile already exists for this account' })
  }

  // Check username availability
  const takenUsername = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
    columns: { id: true },
  })
  if (takenUsername) {
    throw createError({ statusCode: 409, message: 'Username is already taken' })
  }

  const [profile] = await db.insert(profiles).values({
    userId: session.user.id,
    username,
    displayName,
  }).returning()

  return profile
})
```

- [ ] **Step 4: Start dev server and manually verify the endpoints exist**

```bash
npm run dev
```

In a second terminal:
```bash
curl -s http://localhost:3000/api/profiles/check-username?username=test | cat
```

Expected: `{"available":true}` (or similar — may vary if test username exists)

```bash
curl -s http://localhost:3000/api/profiles/me | cat
```

Expected: `{"statusCode":401,"statusMessage":"Unauthorized",...}`

Stop the dev server.

- [ ] **Step 5: Commit**

Use `commit-commands:commit`. Message: `feat: add profile API endpoints (me, check-username, create)`

---

## Task 3: Profile-Required Middleware

Guards all `/dashboard` routes. A single `$fetch` to `/api/profiles/me` handles both the auth check (401 = not signed in) and the profile check (404 = no profile yet).

**Files:**
- Create: `app/middleware/profile-required.ts`
- Modify: `app/pages/dashboard/index.vue`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Create the middleware**

Create `app/middleware/profile-required.ts`:

```ts
export default defineNuxtRouteMiddleware(async () => {
  try {
    await $fetch('/api/profiles/me')
  } catch (error: any) {
    if (error?.statusCode === 401) {
      return navigateTo('/signin')
    }
    if (error?.statusCode === 404) {
      return navigateTo('/onboarding')
    }
    // Unexpected error — let the page handle it
  }
})
```

- [ ] **Step 2: Apply middleware to the dashboard page**

Edit `app/pages/dashboard/index.vue`:

```vue
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="mt-2 text-gray-500">Manage your profile here.</p>
  </div>
</template>
```

- [ ] **Step 3: Add /onboarding to CSR route rules**

Edit `nuxt.config.ts`. Add `/onboarding` to the `routeRules` block:

```ts
routeRules: {
  '/': { prerender: true },
  '/onboarding': { ssr: false },
  '/dashboard/**': { ssr: false },
},
```

- [ ] **Step 4: Commit**

Use `commit-commands:commit`. Message: `feat: add profile-required middleware, apply to dashboard`

---

## Task 4: Onboarding Page

The form that captures username and display name. Pre-fills both from the authenticated user's name/email. Validates username format client-side and checks availability via a debounced API call.

**Files:**
- Create: `app/pages/onboarding.vue`

- [ ] **Step 1: Create the onboarding page**

Create `app/pages/onboarding.vue`:

```vue
<!-- app/pages/onboarding.vue -->
<script setup lang="ts">
import { validateUsername, usernameErrorMessage } from '~/lib/username-validator'

definePageMeta({ layout: 'auth', ssr: false })

const { session } = useAuth()
const router = useRouter()

// Guard: redirect away if user is not signed in or already has a profile
onMounted(async () => {
  if (!session.value?.data?.user) {
    await navigateTo('/signin')
    return
  }
  try {
    await $fetch('/api/profiles/me')
    // Already has a profile — go straight to dashboard
    await navigateTo('/dashboard')
  } catch (error: any) {
    if (error?.statusCode === 401) {
      await navigateTo('/signin')
    }
    // 404 = no profile yet — stay on this page
  }
})

// Pre-fill from session
const user = computed(() => session.value?.data?.user)

function toUsernameSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/@.*$/, '')           // strip email domain
    .replace(/[^a-z0-9_]/g, '_')  // replace invalid chars with underscore
    .replace(/_+/g, '_')          // collapse consecutive underscores
    .replace(/^_|_$/g, '')        // trim leading/trailing underscores
    .slice(0, 30)
}

const form = reactive({ username: '', displayName: '' })

watch(user, (u) => {
  if (!u) return
  if (!form.username) {
    form.username = toUsernameSlug(u.email ?? '')
  }
  if (!form.displayName) {
    form.displayName = (u.name ?? toUsernameSlug(u.email ?? '')).slice(0, 60)
  }
}, { immediate: true })

// Username format validation (client-side, instant)
const usernameValidation = computed(() => validateUsername(form.username))
const usernameFormatError = computed(() =>
  form.username ? usernameErrorMessage(usernameValidation.value) : ''
)

// Username availability check (debounced, 300ms)
const usernameAvailable = ref<boolean | null>(null)
const checkingUsername = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => form.username, (username) => {
  usernameAvailable.value = null
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!username || !usernameValidation.value.valid) return

  checkingUsername.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const result = await $fetch<{ available: boolean }>(
        `/api/profiles/check-username?username=${encodeURIComponent(username)}`
      )
      usernameAvailable.value = result.available
    } finally {
      checkingUsername.value = false
    }
  }, 300)
})

const usernameError = computed(() => {
  if (usernameFormatError.value) return usernameFormatError.value
  if (usernameAvailable.value === false) return 'That username is already taken'
  return ''
})

const usernameHelper = computed(() => {
  if (usernameError.value) return ''
  if (checkingUsername.value) return 'Checking availability…'
  if (usernameAvailable.value === true) return `nicetomeetyou.app/${form.username}`
  return ''
})

const canSubmit = computed(() =>
  !!form.username &&
  !!form.displayName.trim() &&
  usernameValidation.value.valid &&
  usernameAvailable.value === true &&
  !checkingUsername.value
)

const submitError = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!canSubmit.value) return
  submitError.value = ''
  loading.value = true
  try {
    await $fetch('/api/profiles', {
      method: 'POST',
      body: { username: form.username, displayName: form.displayName.trim() },
    })
    await router.push('/dashboard')
  } catch (error: any) {
    if (error?.statusCode === 409) {
      submitError.value = 'That username was just taken. Please choose another.'
    } else {
      submitError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Set up your page</h1>
      <p class="mt-1 text-sm text-warm-muted">
        This is how people will find you. You can change it later.
      </p>
    </div>

    <AppCard>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="username"
          v-model="form.username"
          label="Choose your username"
          placeholder="yourname"
          :error="usernameError"
          :helper="usernameHelper"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
        />
        <AppInput
          id="displayName"
          v-model="form.displayName"
          label="Your display name"
          placeholder="Jane Smith"
        />
        <p v-if="submitError" class="text-sm text-red-500">{{ submitError }}</p>
        <AppButton
          type="submit"
          :loading="loading"
          :disabled="!canSubmit"
          class="w-full"
        >
          Let's go →
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
```

- [ ] **Step 2: Commit**

Use `commit-commands:commit`. Message: `feat: add onboarding page (username + display name)`

---

## Task 5: Post-Signup Redirect

New users should land on `/onboarding` directly after signing up, not bounce through `/dashboard` → `/onboarding`.

**Files:**
- Modify: `app/pages/signup.vue`

- [ ] **Step 1: Change the redirect in signup.vue**

In `app/pages/signup.vue`, find this line:

```ts
await router.push('/dashboard')
```

Replace it with:

```ts
await router.push('/onboarding')
```

- [ ] **Step 2: Commit**

Use `commit-commands:commit`. Message: `fix: redirect to /onboarding after sign up`

---

## Task 6: Handwriting Font

Adds the Caveat font (Google Fonts) as a `font-handwriting` Tailwind utility. Used in the landing page hero and nowhere else.

After implementing, take a Playwright screenshot of the landing page and present it to the user for font approval before proceeding. If they want a different font (Satisfy, Dancing Script, Pacifico are common alternatives), swap the import URL and font name and re-screenshot.

**Files:**
- Modify: `app/assets/css/main.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add Caveat font import to main.css**

In `app/assets/css/main.css`, add the Caveat import after the DM Sans import:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-warm-bg text-warm-text font-sans antialiased;
  }
}
```

- [ ] **Step 2: Add handwriting font family to tailwind.config.ts**

In `tailwind.config.ts`, add `handwriting` to the `fontFamily` block:

```ts
fontFamily: {
  sans: ['DM Sans', 'system-ui', 'sans-serif'],
  handwriting: ['Caveat', 'cursive'],
},
```

- [ ] **Step 3: Commit**

Use `commit-commands:commit`. Message: `chore: add Caveat handwriting font`

---

## Task 7: Landing Page

Replaces the palette-sampler placeholder at `/`. Self-contained page — all nav, sections, and footer live inside `index.vue`. Also updates `default.vue` to use `bg-warm-bg`.

**REQUIRED:** Use the `frontend-design:frontend-design` skill before implementing this task. It will guide producing a distinctive, production-grade result rather than a generic AI-looking page.

**Files:**
- Modify: `app/layouts/default.vue`
- Modify: `app/pages/index.vue`

- [ ] **Step 1: Update default layout**

Replace the full contents of `app/layouts/default.vue`:

```vue
<template>
  <div class="min-h-screen bg-warm-bg">
    <slot />
  </div>
</template>
```

- [ ] **Step 2: Rewrite index.vue as the landing page**

Replace the full contents of `app/pages/index.vue`:

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'default' })

const valueProps = [
  {
    title: 'Privacy-first',
    body: 'Your email and phone number are never exposed. Anyone who reaches out goes through your page.',
  },
  {
    title: 'No algorithm',
    body: 'No feed, no matching, no pressure. Just your page, exactly as you made it.',
  },
  {
    title: 'Works for everyone',
    body: 'Looking for love? New friends? Professional connections? Your page works for all of it.',
  },
  {
    title: 'Free to start',
    body: 'Create your page and generate your QR code, on us.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Create your page',
    body: 'Tell your story in your own words. Add photos, your interests, and what you\'re looking for.',
  },
  {
    number: '2',
    title: 'Generate your QR code',
    body: 'Download it and print it on whatever you want — your tote bag, your hat, a sticker.',
  },
  {
    number: '3',
    title: 'Put yourself out there',
    body: 'Someone scans it, reads your page, and reaches out. No awkward introductions required.',
  },
]
</script>

<template>
  <div>
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-warm-border bg-warm-card/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NuxtLink
          to="/"
          class="text-xs font-bold tracking-[0.2em] text-warm-text uppercase"
        >
          ntmy
        </NuxtLink>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/signin"
            class="rounded-md px-4 py-2 text-sm text-warm-muted transition-colors hover:text-warm-text"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="rounded-md bg-sage-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-600"
          >
            Get started
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-sage-400 py-28 text-white md:py-36">
      <!-- Decorative blobs -->
      <div
        class="pointer-events-none absolute -top-32 -right-32 h-[36rem] w-[36rem] rounded-full bg-sage-300 opacity-25 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-sage-600 opacity-25 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 class="font-handwriting text-6xl leading-tight tracking-wide text-white md:text-7xl lg:text-8xl">
          Nice To Meet You
        </h1>
        <p class="mt-4 text-xl italic text-white/90 md:text-2xl">
          Become approachable without saying a word
        </p>
        <p class="mx-auto mt-6 max-w-2xl text-base text-white/80 md:text-lg">
          Your personal page, your way. Print your QR code, put it in the world,
          and let people reach out — without ever giving up your contact details.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <NuxtLink
            to="/signup"
            class="rounded-md bg-white px-6 py-3 text-sm font-semibold text-sage-700 shadow-sm transition-colors hover:bg-sage-50"
          >
            Create your page
          </NuxtLink>
          <a
            href="#how-it-works"
            class="rounded-md border border-white/60 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>

    <!-- Why we made this -->
    <section class="bg-sage-50 py-24">
      <div class="mx-auto max-w-3xl px-6">
        <h2 class="text-center text-3xl font-semibold text-warm-text">
          Why we made this
        </h2>
        <div class="mt-10 space-y-6 text-lg leading-relaxed text-warm-muted">
          <p>
            Everyone is online these days — but real connections still happen in person.
            At the coffee shop, at a concert, on the train. The problem? Walking up to
            a stranger is hard. Handing someone your number is vulnerable.
          </p>
          <p>
            Nice To Meet You is different. You create a page that represents you — who you
            are, what you love, what you're looking for. Print a QR code and put it on
            whatever you want: your tote bag, your hat, your business card. Now when someone
            notices you, they have a way in — on their own terms.
          </p>
          <p>
            Whether you're looking for love, new friends, or just want a shareable presence
            when you're out in the world — your page has you covered.
          </p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="bg-warm-bg py-24">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-center text-3xl font-semibold text-warm-text">
          How it works
        </h2>
        <div class="mt-16 grid gap-12 md:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex flex-col items-center text-center"
          >
            <span class="font-handwriting text-6xl font-bold text-sage-400">
              {{ step.number }}
            </span>
            <h3 class="mt-3 text-xl font-semibold text-warm-text">{{ step.title }}</h3>
            <p class="mt-2 text-warm-muted">{{ step.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Value props -->
    <section class="bg-warm-card py-24">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-center text-3xl font-semibold text-warm-text">
          Built different
        </h2>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard v-for="prop in valueProps" :key="prop.title" class="flex flex-col gap-2">
            <h3 class="font-semibold text-warm-text">{{ prop.title }}</h3>
            <p class="text-sm text-warm-muted">{{ prop.body }}</p>
          </AppCard>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-warm-border bg-warm-bg py-10">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
        <p class="text-sm text-warm-muted">
          © {{ new Date().getFullYear() }} Nice To Meet You
        </p>
        <div class="flex gap-4">
          <NuxtLink to="/signin" class="text-sm text-warm-muted hover:text-warm-text">
            Sign in
          </NuxtLink>
          <NuxtLink to="/signup" class="text-sm text-warm-muted hover:text-warm-text">
            Get started
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
```

- [ ] **Step 3: Commit**

Use `commit-commands:commit`. Message: `feat: add landing page — hero, why, how it works, value props`

---

## Task 8: Playwright Verification

Verify all new and modified pages before wrapping up. Take screenshots for design review.

**⚠️ Docker must be running first.** Start it with: `wsl bash -c "sudo service docker start && docker compose up -d"`

Then start the dev server: `npm run dev`

- [ ] **Step 1: Verify landing page**

Navigate to `http://localhost:3000`. Take a screenshot.

Confirm:
- Nav renders with "ntmy" wordmark and Sign in / Get started buttons
- Hero section has sage-400 background with "Nice To Meet You" in handwriting font and italic tagline below
- "See how it works" anchor link is visible
- "Why we made this" section is below the hero
- "How it works" section is present with 3 steps
- "Built different" section has 4 value prop cards
- Footer renders at the bottom
- No console errors

- [ ] **Step 2: Verify sign-up → onboarding redirect**

Navigate to `http://localhost:3000/signup`. Take a screenshot.

Sign up with a test email (e.g. `test@example.com`) and a password. Confirm:
- After sign up, redirected to `/onboarding` (not `/dashboard`)
- Onboarding page renders with auth layout
- "Set up your page" heading visible
- Username field is pre-filled with the email prefix
- Display name field is pre-filled

- [ ] **Step 3: Verify onboarding form behavior**

On the onboarding page:
- Clear the username field and type `ab` — confirm inline error "at least 3 characters"
- Type `John Doe` — confirm inline error about lowercase/invalid chars
- Type a valid username (e.g. `testuser123`) — confirm debounce triggers and availability message appears
- If available: confirm "nicetomeetyou.app/testuser123" helper text appears
- Confirm "Let's go →" button is disabled until a valid available username is entered
- Fill in display name and submit — confirm redirect to `/dashboard`

- [ ] **Step 4: Verify dashboard middleware**

Sign out (or open an incognito window). Try navigating directly to `http://localhost:3000/dashboard`. Confirm:
- Redirected to `/signin`

Sign in with the test account (which now has a profile). Navigate to `/dashboard`. Confirm:
- Passes through to the dashboard without redirect

- [ ] **Step 5: Verify onboarding guard for existing users**

While signed in (with profile), navigate directly to `http://localhost:3000/onboarding`. Confirm:
- Immediately redirected to `/dashboard`

- [ ] **Step 6: Take final screenshots**

Take screenshots of:
- Landing page (full scroll if possible, or multiple screenshots)
- Onboarding page
- Dashboard (post-onboarding)

Present these to the user for design review before proceeding to Phase 3.

- [ ] **Step 7: Commit if any minor fixes were made during verification**

Use `commit-commands:commit` if any issues were fixed in the verification steps.

---

## Done

All tasks complete when:
- [ ] `npm test` passes (username validator unit tests)
- [ ] All 3 profile API endpoints exist and respond correctly
- [ ] Middleware redirects unauthenticated → `/signin`, no-profile → `/onboarding`
- [ ] Onboarding page creates a profile and redirects to `/dashboard`
- [ ] Sign-up flow lands on `/onboarding`
- [ ] Landing page renders all 6 sections with correct design
- [ ] Playwright screenshots taken and presented for design review
