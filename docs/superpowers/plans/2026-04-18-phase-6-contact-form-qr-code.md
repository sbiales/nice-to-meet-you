# Phase 6: Contact Form + QR Code — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the contact form on public profiles (stored + emailed to owner) and add a QR code generation page in the dashboard.

**Architecture:** A persistent `ContactForm.vue` renders at the bottom of active + contactable public profiles. A new `POST /api/contact/[username]` endpoint validates input, rate-limits by IP, stores in `contact_messages`, and emails the profile owner via `sendEmail`. The `contact_button` block is updated to scroll to the form's `#contact` anchor. The QR code page at `/dashboard/qr` generates the code client-side via the `qrcode` npm package and offers PNG download.

**Tech Stack:** Nuxt 4, Vue 3, Drizzle ORM, H3 (`getRequestIP`, `readBody`), Vitest (DB-layer + unit tests), `qrcode` npm package.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| CREATE | `server/utils/rate-limit.ts` | In-memory IP-based rate limiter |
| CREATE | `server/api/contact/[username].post.ts` | Contact form submission endpoint |
| CREATE | `__tests__/api/contact.test.ts` | Rate limiter unit tests + DB-layer tests |
| CREATE | `app/components/profile/ContactForm.vue` | Contact form UI component |
| MODIFY | `app/components/blocks/display/ContactButtonBlock.vue` | Scroll to `#contact` on click |
| MODIFY | `app/pages/[username].vue` | Remove `contact_button` filter, add `ContactForm` |
| CREATE | `app/pages/dashboard/qr.vue` | QR code generation + PNG download page |
| MODIFY | `app/layouts/dashboard.vue` | Add "Generate QR" nav link |

---

### Task 1: Rate limiter utility

**Files:**
- Create: `server/utils/rate-limit.ts`
- Create: `__tests__/api/contact.test.ts`

- [ ] **Step 1: Create `server/utils/rate-limit.ts`**

```typescript
// server/utils/rate-limit.ts
const store = new Map<string, number[]>()

export function checkRateLimit(ip: string, maxRequests = 3, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (store.get(ip) ?? []).filter(t => t > windowStart)
  if (timestamps.length >= maxRequests) return false
  store.set(ip, [...timestamps, now])
  return true
}
```

- [ ] **Step 2: Create `__tests__/api/contact.test.ts` with rate limiter tests**

```typescript
// __tests__/api/contact.test.ts
import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '~~/server/utils/rate-limit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const ip = `allow-${Date.now()}`
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true)
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true)
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true)
  })

  it('blocks the request that exceeds the limit', () => {
    const ip = `block-${Date.now()}`
    checkRateLimit(ip, 3, 60_000)
    checkRateLimit(ip, 3, 60_000)
    checkRateLimit(ip, 3, 60_000)
    expect(checkRateLimit(ip, 3, 60_000)).toBe(false)
  })

  it('allows requests again after the window expires', async () => {
    const ip = `expire-${Date.now()}`
    checkRateLimit(ip, 1, 50)
    expect(checkRateLimit(ip, 1, 50)).toBe(false)
    await new Promise(r => setTimeout(r, 60))
    expect(checkRateLimit(ip, 1, 50)).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --testPathPattern="contact"
```
Expected: 3 tests PASS

- [ ] **Step 4: Commit**

```bash
git add server/utils/rate-limit.ts __tests__/api/contact.test.ts
git commit -m "feat: add in-memory rate limiter utility"
```

---

### Task 2: Contact API endpoint + DB tests

**Files:**
- Create: `server/api/contact/[username].post.ts`
- Modify: `__tests__/api/contact.test.ts`

- [ ] **Step 1: Append DB tests to `__tests__/api/contact.test.ts`**

Add these imports at the top of the file (after the existing import):

```typescript
import { beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { profiles } from '~~/server/db/schema/profiles'
import { user } from '~~/server/db/schema/auth'
import { contactMessages } from '~~/server/db/schema/contact-messages'
```

Then append these test suites at the bottom of the file:

```typescript
const TEST_USER_ID = 'contact-endpoint-test-user'
const TEST_USERNAME = 'contact_endpoint_test'

beforeAll(async () => {
  await db.insert(user).values({
    id: TEST_USER_ID,
    name: 'Contact Test',
    email: 'contactendpointtest@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing()

  await db.insert(profiles).values({
    userId: TEST_USER_ID,
    username: TEST_USERNAME,
    displayName: 'Contact Test',
    status: 'active',
    isContactable: true,
    blocks: [],
  }).onConflictDoNothing()
})

afterAll(async () => {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, TEST_USER_ID),
  })
  if (profile) {
    await db.delete(contactMessages).where(eq(contactMessages.profileId, profile.id))
  }
  await db.delete(profiles).where(eq(profiles.userId, TEST_USER_ID))
  await db.delete(user).where(eq(user.id, TEST_USER_ID))
})

async function storeMessage(data: { senderName: string; senderEmail?: string | null; message: string }) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, TEST_USERNAME),
  })
  if (!profile) throw new Error('Test profile not found')
  const [msg] = await db.insert(contactMessages).values({
    profileId: profile.id,
    senderName: data.senderName,
    senderEmail: data.senderEmail ?? null,
    message: data.message,
  }).returning()
  return msg
}

describe('contact message storage', () => {
  it('stores a message with email', async () => {
    const msg = await storeMessage({ senderName: 'Alice', senderEmail: 'alice@example.com', message: 'Hello!' })
    expect(msg.senderName).toBe('Alice')
    expect(msg.senderEmail).toBe('alice@example.com')
    expect(msg.message).toBe('Hello!')
    expect(msg.isRead).toBe(false)
  })

  it('stores a message without email', async () => {
    const msg = await storeMessage({ senderName: 'Bob', message: 'Just saying hi' })
    expect(msg.senderEmail).toBeNull()
  })
})

describe('profile contact eligibility', () => {
  it('paused profile is not eligible', async () => {
    await db.update(profiles)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.username, TEST_USERNAME) })
    expect(profile?.status === 'active' && profile?.isContactable).toBe(false)
    await db.update(profiles).set({ status: 'active', updatedAt: new Date() }).where(eq(profiles.userId, TEST_USER_ID))
  })

  it('non-contactable profile is not eligible', async () => {
    await db.update(profiles)
      .set({ isContactable: false, updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.username, TEST_USERNAME) })
    expect(profile?.status === 'active' && profile?.isContactable).toBe(false)
    await db.update(profiles).set({ isContactable: true, updatedAt: new Date() }).where(eq(profiles.userId, TEST_USER_ID))
  })
})
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
npm test -- --testPathPattern="contact"
```
Expected: all 7 tests PASS

- [ ] **Step 3: Create `server/api/contact/[username].post.ts`**

```typescript
// server/api/contact/[username].post.ts
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { user } from '../../db/schema/auth'
import { contactMessages } from '../../db/schema/contact-messages'
import { sendEmail } from '../../lib/email'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!checkRateLimit(ip)) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }

  const username = getRouterParam(event, 'username')
  if (!username) {
    throw createError({ statusCode: 400, message: 'Username required' })
  }

  const body = await readBody(event)
  const { name, email, message } = body ?? {}

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (!message?.trim()) throw createError({ statusCode: 400, message: 'Message is required' })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })

  if (!profile || profile.deletedAt) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }
  if (profile.status !== 'active' || !profile.isContactable) {
    throw createError({ statusCode: 403, message: 'This profile is not accepting messages' })
  }

  await db.insert(contactMessages).values({
    profileId: profile.id,
    senderName: name.trim(),
    senderEmail: email?.trim() || null,
    message: message.trim(),
  })

  const ownerRows = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, profile.userId))
    .limit(1)
  const ownerEmail = ownerRows[0]?.email

  if (ownerEmail) {
    const replyLine = email
      ? `<p>Reply to: <a href="mailto:${email}">${email}</a></p>`
      : `<p><em>No email provided — they did not include contact details.</em></p>`

    await sendEmail({
      to: ownerEmail,
      subject: `New message from ${name.trim()} on Nice To Meet You`,
      html: `
        <p><strong>${name.trim()}</strong> sent you a message:</p>
        <blockquote style="border-left:3px solid #ccc;padding-left:1em;margin:1em 0">
          ${message.trim().replace(/\n/g, '<br>')}
        </blockquote>
        ${replyLine}
      `,
    })
  }

  return { success: true }
})
```

- [ ] **Step 4: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add server/api/contact/[username].post.ts __tests__/api/contact.test.ts
git commit -m "feat: add POST /api/contact/[username] endpoint with rate limiting"
```

---

### Task 3: ContactForm.vue

**Files:**
- Create: `app/components/profile/ContactForm.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/profile/ContactForm.vue -->
<script setup lang="ts">
const props = defineProps<{
  username: string
}>()

const name = ref('')
const email = ref('')
const message = ref('')
const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const errorMessage = ref('')

async function handleSubmit() {
  status.value = 'submitting'
  errorMessage.value = ''
  try {
    await $fetch(`/api/contact/${props.username}`, {
      method: 'POST',
      body: {
        name: name.value.trim(),
        email: email.value.trim() || undefined,
        message: message.value.trim(),
      },
    })
    status.value = 'success'
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.data?.message ?? 'Something went wrong. Please try again.'
  }
}
</script>

<template>
  <section id="contact" class="mt-6 border-t border-warm-border px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <h2 class="mb-6 text-xl font-semibold text-warm-text">Get in touch</h2>

      <div v-if="status === 'success'" class="rounded-lg bg-sage-50 p-6 text-center">
        <p class="font-medium text-sage-700">Message sent!</p>
        <p class="mt-1 text-sm text-warm-muted">They'll get back to you if you left your email.</p>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-warm-text">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Your name"
            class="w-full rounded-md border border-warm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-warm-text">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="w-full rounded-md border border-warm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
          <p class="mt-1 text-xs text-warm-muted">Required if you want a reply</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-warm-text">
            Message <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="message"
            required
            rows="4"
            placeholder="Say something..."
            class="w-full resize-none rounded-md border border-warm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
        </div>

        <p v-if="status === 'error'" class="text-sm text-red-500">{{ errorMessage }}</p>

        <button
          type="submit"
          :disabled="status === 'submitting'"
          class="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {{ status === 'submitting' ? 'Sending…' : 'Send message' }}
        </button>
      </form>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/components/profile/ContactForm.vue
git commit -m "feat: add ContactForm component"
```

---

### Task 4: Update ContactButtonBlock.vue — scroll to contact

**Files:**
- Modify: `app/components/blocks/display/ContactButtonBlock.vue`

- [ ] **Step 1: Replace the file**

```vue
<!-- app/components/blocks/display/ContactButtonBlock.vue -->
<script setup lang="ts">
import type { ContactButtonBlockData } from '~/types/blocks'

defineProps<{ data: ContactButtonBlockData }>()

function scrollToContact() {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="flex justify-center">
    <button
      type="button"
      class="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      @click="scrollToContact"
    >
      {{ data.label || 'Get in touch' }}
    </button>
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
git add app/components/blocks/display/ContactButtonBlock.vue
git commit -m "feat: contact_button block scrolls to #contact section"
```

---

### Task 5: Update [username].vue — remove filter + add ContactForm

**Files:**
- Modify: `app/pages/[username].vue`

- [ ] **Step 1: Remove the `contact_button` filter from the `blocks` computed**

Find:
```typescript
const blocks = computed(() =>
  (profile.value?.blocks as AnyBlock[] ?? []).filter(b => b.type !== 'contact_button')
)
```

Replace with:
```typescript
const blocks = computed(() => profile.value?.blocks as AnyBlock[] ?? [])
```

- [ ] **Step 2: Add `isContactable` computed after the existing computed refs**

After the line:
```typescript
const headerImageKey = computed(() => profile.value?.headerImageKey as string | null ?? null)
```

Add:
```typescript
const isContactable = computed(() => profile.value?.isContactable as boolean ?? false)
```

- [ ] **Step 3: Add `<ContactForm>` to the active/taken template section**

In the `<template v-else>` block (active/taken profiles), after the closing `</div>` of the block canvas section and before `<ProfileStamp v-if="status === 'taken'" ...>`, add:

```vue
<ContactForm
  v-if="isContactable && status === 'active'"
  :username="username"
/>
```

The full `<template v-else>` block should look like this after the edit:

```vue
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

  <ContactForm
    v-if="isContactable && status === 'active'"
    :username="username"
  />

  <ProfileStamp v-if="status === 'taken'" status="taken" />
</template>
```

- [ ] **Step 4: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 5: Run all tests**

```bash
npm test
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add app/pages/[username].vue
git commit -m "feat: show contact form on active public profiles"
```

---

### Task 6: QR code page

**Files:**
- Create: `app/pages/dashboard/qr.vue`

- [ ] **Step 1: Install `qrcode` package**

```bash
npm install qrcode @types/qrcode --legacy-peer-deps
```
Expected: installed without errors, `package.json` updated

- [ ] **Step 2: Create `app/pages/dashboard/qr.vue`**

```vue
<!-- app/pages/dashboard/qr.vue -->
<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })

const { username, saveStatus, loadProfile } = useProfile()
const config = useRuntimeConfig()

provide('saveStatus', saveStatus)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const profileUrl = computed(() => `${config.public.appUrl}/${username.value}`)

async function renderQR() {
  if (!canvasRef.value || !username.value) return
  await QRCode.toCanvas(canvasRef.value, profileUrl.value, {
    width: 300,
    errorCorrectionLevel: 'M',
  })
}

function downloadPNG() {
  if (!canvasRef.value) return
  const a = document.createElement('a')
  a.download = `nicetomeetyou-${username.value}.png`
  a.href = canvasRef.value.toDataURL('image/png')
  a.click()
}

onMounted(async () => {
  await loadProfile()
  await renderQR()
})
</script>

<template>
  <div class="flex h-[calc(100vh-56px)] items-center justify-center">
    <div class="flex flex-col items-center gap-6 rounded-2xl border border-warm-border bg-warm-card p-10 shadow-sm">
      <h1 class="text-2xl font-bold text-warm-text">Your QR Code</h1>
      <canvas ref="canvasRef" class="rounded-lg" />
      <p class="text-sm text-warm-muted">{{ profileUrl }}</p>
      <button
        class="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        @click="downloadPNG"
      >
        Download PNG
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/pages/dashboard/qr.vue package.json package-lock.json
git commit -m "feat: add QR code generation page at /dashboard/qr"
```

---

### Task 7: Dashboard nav — Add Generate QR link

**Files:**
- Modify: `app/layouts/dashboard.vue`

- [ ] **Step 1: Add "Generate QR" nav link**

In `app/layouts/dashboard.vue`, inside `<div class="flex items-center gap-4">`, add the link immediately before the existing Settings link. The full `<div class="flex items-center gap-4">` section should look like:

```vue
<div class="flex items-center gap-4">
  <span v-if="saveStatus === 'saving'" class="text-xs text-warm-muted">Saving…</span>
  <span v-else-if="saveStatus === 'saved'" class="text-xs text-sage-600">Saved ✓</span>
  <span v-else-if="saveStatus === 'error'" class="text-xs text-red-500">Failed to save</span>
  <NuxtLink
    to="/dashboard/qr"
    class="text-sm text-warm-muted transition-colors hover:text-warm-text"
  >
    Generate QR
  </NuxtLink>
  <NuxtLink
    to="/dashboard/settings"
    class="text-sm text-warm-muted transition-colors hover:text-warm-text"
  >
    Settings
  </NuxtLink>
  <button
    class="text-sm text-warm-muted transition-colors hover:text-warm-text"
    @click="handleSignOut"
  >Sign out</button>
</div>
```

- [ ] **Step 2: Run typecheck**

```bash
npx nuxi typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/layouts/dashboard.vue
git commit -m "feat: add Generate QR link to dashboard nav"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full test suite + typecheck**

```bash
npm test && npx nuxi typecheck
```
Expected: all PASS, no type errors

- [ ] **Step 2: Start dev server**

```bash
nuxt dev
```

- [ ] **Step 3: Playwright verification — contact form**

1. Navigate to `http://localhost:3000/<your-test-username>` (active profile)
2. Scroll to the bottom — verify the "Get in touch" section is visible with name, email, and message fields
3. Submit with name + message only (no email) — verify success message appears
4. Check Mailpit at `http://localhost:8025` — verify owner received an email; confirm body shows name + message and "No email provided" note
5. Submit again with all three fields — check Mailpit confirms the reply-to email is included in the body
6. If a `contact_button` block exists on the profile, click it — verify page smoothly scrolls to the contact form

- [ ] **Step 4: Playwright verification — status gating**

7. Set profile status to `paused` in the DB (via psql or drizzle studio) — navigate to the profile, verify no contact form appears
8. Set status to `taken` — verify no contact form (full content + stamp visible, no form)
9. Reset status to `active`

- [ ] **Step 5: Playwright verification — rate limiting**

> Note: the in-memory rate limiter is per-IP; in local dev all requests share `127.0.0.1`. Restart the dev server after this step to reset the store for any subsequent testing.

10. Submit the contact form 3 times in quick succession
11. On the 4th submit, verify the form shows the error: "Too many requests. Please try again later."
12. Restart the dev server: `npx kill-port 3000 && nuxt dev`

- [ ] **Step 6: Playwright verification — QR code page**

13. Navigate to `http://localhost:3000/dashboard`
14. Verify "Generate QR" appears in the nav to the left of Settings
15. Click "Generate QR" — verify `/dashboard/qr` loads and a QR code renders on the canvas
16. Verify the profile URL is displayed below the QR code
17. Click "Download PNG" — verify a file named `nicetomeetyou-<username>.png` downloads
18. Open the PNG and scan the QR code (phone camera or browser QR extension) — verify it resolves to the correct profile URL

- [ ] **Step 7: Kill dev server**

```bash
npx kill-port 3000
```

- [ ] **Step 8: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 6: Contact form + QR code" --body "$(cat <<'EOF'
## Summary
- New `POST /api/contact/[username]` endpoint — validates input, in-memory rate limit (3/10 min per IP), stores in `contact_messages`, emails owner via Resend/Mailpit
- `ContactForm.vue` — persistent contact section at the bottom of active + contactable profiles; name required, email optional with reply hint, message required; inline success/error states
- `contact_button` block updated to scroll to `#contact` anchor (useful as a jump-to-form shortcut)
- `[username].vue` — removes `contact_button` filter, shows `ContactForm` only for active + contactable profiles
- `app/pages/dashboard/qr.vue` — client-side QR generation via `qrcode` package using `config.public.appUrl`; PNG download
- Dashboard nav updated: "Generate QR" added left of Settings

## Test plan
- [ ] `npm test` passes
- [ ] `npx nuxi typecheck` passes
- [ ] Active profile: contact form visible at bottom
- [ ] Form submission stores message and triggers email (verified in Mailpit)
- [ ] Rate limit: 4th submission in window returns 429 error in form
- [ ] `contact_button` block scrolls to form
- [ ] Paused profile: no contact form shown
- [ ] Taken profile: no contact form shown (full content + stamp visible)
- [ ] QR page renders QR code, displays profile URL, downloads PNG
- [ ] "Generate QR" link appears in dashboard nav left of Settings
EOF
)"
```
