# Phase 1: Auth UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the auth UI (sign in, sign up, forgot/reset password) and establish the design system foundation — colors, typography, and base components that all future UI will build on.

**Architecture:** Nuxt 4 with client code under `app/`. Design tokens live in `tailwind.config.ts`. Reusable UI components in `app/components/ui/`. Auth-specific components in `app/components/auth/`. Better Auth client-side SDK wired through a thin composable. Four auth pages using a shared auth layout.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, Tailwind CSS, Better Auth (vue client), Playwright (verification)

**Design direction:** Warm, friendly, indie brand feel. Sage green accent (#6B9E76), warm off-white background (#FAFAF8), DM Sans font, medium border radius.

**Available tools:**
- `context7` — verify Better Auth Vue client API before implementing composable
- `commit-commands:commit` — use for all commits
- `mcp__plugin_playwright_playwright__*` — verify every page renders before committing

**⚠️ STOP AFTER TASK 9:** After all pages are Playwright-verified, stop and present the UI for design review. Do not proceed to Phase 2 until the design is approved.

---

## File Map

```
tailwind.config.ts                              # MODIFY — design tokens (colors, font)
app/assets/css/main.css                         # MODIFY — DM Sans font import
app/lib/
  auth-client.ts                                # CREATE — Better Auth client-side instance
  reserved-usernames.ts                         # CREATE — reserved slug list + validator
app/composables/
  useAuth.ts                                    # CREATE — thin auth composable
app/components/
  ui/
    AppButton.vue                               # CREATE — primary/secondary/ghost + loading
    AppInput.vue                                # CREATE — label, error state, helper text
    AppCard.vue                                 # CREATE — card wrapper
  auth/
    SocialAuthButton.vue                        # CREATE — Google sign-in button
app/layouts/
  auth.vue                                      # CREATE — centered layout with logo
app/pages/
  signin.vue                                    # CREATE — sign in form
  signup.vue                                    # CREATE — sign up form
  forgot-password.vue                           # CREATE — request reset link
  reset-password.vue                            # CREATE — set new password
```

---

## Task 1: Design Tokens

Establishes the color palette, typography, and spacing that all components will use. Everything visual flows from here.

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/assets/css/main.css`

- [ ] **Step 1: Update tailwind.config.ts with design tokens**

Replace the full file:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f2f7f3',
          100: '#deeee2',
          200: '#beddca',
          300: '#93c5a9',
          400: '#64a685',
          500: '#6B9E76',
          600: '#4a7d57',
          700: '#3b6446',
          800: '#315139',
          900: '#294330',
          950: '#132419',
        },
        warm: {
          bg: '#FAFAF8',
          card: '#FFFFFF',
          text: '#1A1A17',
          muted: '#6B6860',
          border: '#E5E0D8',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 2: Add DM Sans font import and base styles to main.css**

Replace the full file:

```css
/* app/assets/css/main.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-warm-bg text-warm-text font-sans antialiased;
  }
}
```

- [ ] **Step 3: Verify font and colours load in dev**

```bash
npm run dev
```

Open `http://localhost:3000`. Open browser DevTools → Elements. Confirm:
- `body` has `font-family: "DM Sans"` applied
- Background colour is `#FAFAF8` (warm off-white, not pure white)

- [ ] **Step 4: Commit**

Use `commit-commands:commit` skill. Suggested message: `chore: add design tokens — sage palette, DM Sans, warm neutrals`

---

## Task 2: AppButton Component

The primary interactive element. Used on every auth form and throughout the app.

**Files:**
- Create: `app/components/ui/AppButton.vue`

- [ ] **Step 1: Create AppButton.vue**

```vue
<!-- app/components/ui/AppButton.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variant === 'primary' && 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700',
      variant === 'secondary' && 'border border-warm-border bg-warm-card text-warm-text hover:bg-warm-bg',
      variant === 'ghost' && 'text-warm-muted hover:bg-warm-bg hover:text-warm-text',
    ]"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
```

- [ ] **Step 2: Verify with Playwright — button renders and variants look correct**

Start dev server: `npm run dev`

Use Playwright to navigate to `http://localhost:3000` and confirm the dev server is running without errors. (Full visual button verification will happen during the page tasks when buttons appear in context.)

- [ ] **Step 3: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add AppButton component (primary/secondary/ghost + loading state)`

---

## Task 3: AppInput Component

Form input with label, error state, and helper text. Used on every auth form.

**Files:**
- Create: `app/components/ui/AppInput.vue`

- [ ] **Step 1: Create AppInput.vue**

```vue
<!-- app/components/ui/AppInput.vue -->
<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  helper?: string
  id?: string
}

defineProps<Props>()
const model = defineModel<string>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      :for="id"
      class="text-sm font-medium text-warm-text"
    >
      {{ label }}
    </label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :class="[
        'w-full rounded-md border bg-warm-card px-3 py-2.5 text-sm text-warm-text',
        'placeholder:text-warm-muted/50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-400 focus:ring-red-400'
          : 'border-warm-border hover:border-sage-300 focus:ring-sage-500',
      ]"
    />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    <p v-else-if="helper" class="text-xs text-warm-muted">{{ helper }}</p>
  </div>
</template>
```

- [ ] **Step 2: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add AppInput component (label, error state, helper text)`

---

## Task 4: AppCard Component

Simple card wrapper. Used by all auth forms and future dashboard sections.

**Files:**
- Create: `app/components/ui/AppCard.vue`

- [ ] **Step 1: Create AppCard.vue**

```vue
<!-- app/components/ui/AppCard.vue -->
<template>
  <div class="rounded-lg border border-warm-border bg-warm-card p-6 shadow-sm">
    <slot />
  </div>
</template>
```

- [ ] **Step 2: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add AppCard component`

---

## Task 5: Auth Client, Composable, Reserved Usernames, and Validation Logic

Wires up Better Auth's client-side SDK, defines the reserved username list, and extracts sign-up form validation as a pure tested function.

**Files:**
- Create: `app/lib/auth-client.ts`
- Create: `app/lib/reserved-usernames.ts`
- Create: `app/lib/validation.ts`
- Create: `app/composables/useAuth.ts`
- Create: `__tests__/lib/reserved-usernames.test.ts`
- Create: `__tests__/lib/validation.test.ts`

- [ ] **Step 1: Verify Better Auth Vue client API using context7**

Use `context7` to look up the Better Auth Vue client documentation. Confirm the correct import path (`better-auth/vue`), the `createAuthClient` signature, and exact method names for: `signIn.email`, `signUp.email`, `signOut`, `forgetPassword`, `resetPassword`, `useSession`.

This step is required — do not skip. Better Auth's API changes between versions and the plan's method names must be verified.

- [ ] **Step 2: Write failing test for isReservedUsername**

```ts
// __tests__/lib/reserved-usernames.test.ts
import { isReservedUsername } from '~/app/lib/reserved-usernames'

describe('isReservedUsername', () => {
  it('returns true for reserved slugs', () => {
    expect(isReservedUsername('signin')).toBe(true)
    expect(isReservedUsername('signup')).toBe(true)
    expect(isReservedUsername('dashboard')).toBe(true)
    expect(isReservedUsername('admin')).toBe(true)
    expect(isReservedUsername('api')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isReservedUsername('SIGNIN')).toBe(true)
    expect(isReservedUsername('Dashboard')).toBe(true)
  })

  it('returns false for regular usernames', () => {
    expect(isReservedUsername('alex')).toBe(false)
    expect(isReservedUsername('siena')).toBe(false)
    expect(isReservedUsername('coolperson')).toBe(false)
  })
})
```

- [ ] **Step 3: Run test — confirm it fails**

```bash
npm test __tests__/lib/reserved-usernames.test.ts
```

Expected: FAIL — `Cannot find module '~/app/lib/reserved-usernames'`

- [ ] **Step 4: Create auth-client.ts**

```ts
// app/lib/auth-client.ts
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000',
})
```

- [ ] **Step 5: Create reserved-usernames.ts**

```ts
// app/lib/reserved-usernames.ts
export const RESERVED_USERNAMES = new Set([
  'signin',
  'signup',
  'login',
  'logout',
  'register',
  'dashboard',
  'api',
  'auth',
  'admin',
  'settings',
  'forgot-password',
  'reset-password',
  'profile',
  'account',
  'me',
  'user',
  'users',
  'help',
  'support',
  'about',
  'terms',
  'privacy',
  'contact',
])

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}
```

- [ ] **Step 6: Run test — confirm it passes**

```bash
npm test __tests__/lib/reserved-usernames.test.ts
```

Expected: PASS — 3 test suites, all green.

- [ ] **Step 7: Write failing test for sign-up form validation**

```ts
// __tests__/lib/validation.test.ts
import { validateSignUpForm } from '~/app/lib/validation'

describe('validateSignUpForm', () => {
  it('returns errors when all fields are empty', () => {
    const result = validateSignUpForm({ name: '', email: '', password: '' })
    expect(result.name).toBeTruthy()
    expect(result.email).toBeTruthy()
    expect(result.password).toBeTruthy()
  })

  it('returns error when name is too short', () => {
    const result = validateSignUpForm({ name: 'A', email: 'test@example.com', password: 'password123' })
    expect(result.name).toBeTruthy()
    expect(result.email).toBe('')
    expect(result.password).toBe('')
  })

  it('returns error for invalid email', () => {
    const result = validateSignUpForm({ name: 'Alex', email: 'notanemail', password: 'password123' })
    expect(result.email).toBeTruthy()
    expect(result.name).toBe('')
    expect(result.password).toBe('')
  })

  it('returns error when password is too short', () => {
    const result = validateSignUpForm({ name: 'Alex', email: 'test@example.com', password: 'short' })
    expect(result.password).toBeTruthy()
    expect(result.name).toBe('')
    expect(result.email).toBe('')
  })

  it('returns no errors for valid input', () => {
    const result = validateSignUpForm({ name: 'Alex', email: 'test@example.com', password: 'password123' })
    expect(result.name).toBe('')
    expect(result.email).toBe('')
    expect(result.password).toBe('')
  })
})
```

- [ ] **Step 8: Run test — confirm it fails**

```bash
npm test __tests__/lib/validation.test.ts
```

Expected: FAIL — `Cannot find module '~/app/lib/validation'`

- [ ] **Step 9: Create validation.ts**

```ts
// app/lib/validation.ts
interface SignUpFormData {
  name: string
  email: string
  password: string
}

interface SignUpFormErrors {
  name: string
  email: string
  password: string
}

export function validateSignUpForm(data: SignUpFormData): SignUpFormErrors {
  return {
    name: data.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
    email: !data.email.includes('@') ? 'Enter a valid email address' : '',
    password: data.password.length < 8 ? 'Password must be at least 8 characters' : '',
  }
}
```

- [ ] **Step 10: Run test — confirm it passes**

```bash
npm test __tests__/lib/validation.test.ts
```

Expected: PASS — 5 tests, all green.

- [ ] **Step 11: Run full test suite — confirm no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 12: Create useAuth.ts composable**

Use the exact method names confirmed in Step 1. The structure below uses the expected API — adjust method names if context7 shows different names:

```ts
// app/composables/useAuth.ts
import { authClient } from '~/app/lib/auth-client'

export function useAuth() {
  const session = authClient.useSession()

  async function signIn(email: string, password: string) {
    return authClient.signIn.email({ email, password })
  }

  async function signUp(email: string, password: string, name: string) {
    return authClient.signUp.email({ email, password, name })
  }

  async function signOut() {
    return authClient.signOut()
  }

  async function forgotPassword(email: string) {
    // Note: Better Auth uses "forgetPassword" (not "forgot") — verify with context7
    return authClient.forgetPassword({ email, redirectTo: '/reset-password' })
  }

  async function resetPassword(token: string, newPassword: string) {
    return authClient.resetPassword({ token, newPassword })
  }

  return { session, signIn, signUp, signOut, forgotPassword, resetPassword }
}
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx nuxi typecheck
```

Expected: no errors. If `~/app/lib/auth-client` alias doesn't resolve, try `../lib/auth-client` (relative) — the `~` alias can be unreliable in `app/` subdirs.

- [ ] **Step 6: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add Better Auth client, useAuth composable, and reserved username list`

---

## Task 6: SocialAuthButton Component

Google sign-in button. Appears on both sign in and sign up pages.

**Files:**
- Create: `app/components/auth/SocialAuthButton.vue`

- [ ] **Step 1: Create SocialAuthButton.vue**

```vue
<!-- app/components/auth/SocialAuthButton.vue -->
<script setup lang="ts">
import { authClient } from '~/app/lib/auth-client'

interface Props {
  provider: 'google'
}

const props = defineProps<Props>()
const loading = ref(false)

const providerConfig = {
  google: {
    label: 'Continue with Google',
  },
}

async function handleClick() {
  loading.value = true
  try {
    await authClient.signIn.social({
      provider: props.provider,
      callbackURL: '/dashboard',
    })
  } catch {
    loading.value = false
  }
}
</script>

<template>
  <button
    type="button"
    :disabled="loading"
    class="inline-flex w-full items-center justify-center gap-2.5 rounded-md border border-warm-border bg-warm-card px-4 py-2.5 text-sm font-medium text-warm-text transition-colors hover:bg-warm-bg disabled:pointer-events-none disabled:opacity-50"
    @click="handleClick"
  >
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <span v-else>{{ providerConfig[provider].label }}</span>
  </button>
</template>
```

- [ ] **Step 2: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add SocialAuthButton component (Google)`

---

## Task 7: Auth Layout

Centered layout with logo used by all four auth pages.

**Files:**
- Create: `app/layouts/auth.vue`

- [ ] **Step 1: Create auth.vue layout**

```vue
<!-- app/layouts/auth.vue -->
<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-warm-bg px-4 py-12">
    <div class="mb-8 text-center">
      <NuxtLink to="/" class="inline-block">
        <span class="text-2xl font-semibold tracking-tight text-warm-text">
          nice to meet you
        </span>
      </NuxtLink>
    </div>
    <div class="w-full max-w-sm">
      <slot />
    </div>
    <p class="mt-8 text-xs text-warm-muted">
      © {{ new Date().getFullYear() }} Nice To Meet You
    </p>
  </div>
</template>
```

- [ ] **Step 2: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add auth layout`

---

## Task 8: Sign In Page

**Files:**
- Create: `app/pages/signin.vue`

- [ ] **Step 1: Create signin.vue**

```vue
<!-- app/pages/signin.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await signIn(form.email, form.password)
    if (result?.error) {
      error.value = result.error.message ?? 'Sign in failed. Please try again.'
    } else {
      await router.push('/dashboard')
    }
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Welcome back</h1>
      <p class="mt-1 text-sm text-warm-muted">Sign in to your account</p>
    </div>

    <AppCard>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
        <div>
          <AppInput
            id="password"
            v-model="form.password"
            label="Password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
          <div class="mt-1.5 flex justify-end">
            <NuxtLink
              to="/forgot-password"
              class="text-xs text-sage-500 hover:text-sage-600"
            >
              Forgot password?
            </NuxtLink>
          </div>
        </div>
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Sign in
        </AppButton>
        <div class="relative flex items-center gap-3">
          <div class="h-px flex-1 bg-warm-border" />
          <span class="text-xs text-warm-muted">or</span>
          <div class="h-px flex-1 bg-warm-border" />
        </div>
        <SocialAuthButton provider="google" />
      </form>
    </AppCard>

    <p class="mt-4 text-center text-sm text-warm-muted">
      Don't have an account?
      <NuxtLink to="/signup" class="font-medium text-sage-500 hover:text-sage-600">
        Sign up
      </NuxtLink>
    </p>
  </div>
</template>
```

- [ ] **Step 2: Verify with Playwright**

Start dev server: `npm run dev`

Use Playwright to:
1. Navigate to `http://localhost:3000/signin`
2. Take a screenshot — confirm page renders (heading "Welcome back", email/password inputs, sign in button, Google button, "Sign up" link)
3. Check browser console for errors — there should be none

- [ ] **Step 3: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add sign in page`

---

## Task 9: Sign Up Page

**Files:**
- Create: `app/pages/signup.vue`

- [ ] **Step 1: Create signup.vue**

```vue
<!-- app/pages/signup.vue -->
<script setup lang="ts">
import { validateSignUpForm } from '~/app/lib/validation'

definePageMeta({ layout: 'auth' })

const { signUp } = useAuth()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })
const submitError = ref('')
const loading = ref(false)

async function handleSubmit() {
  const result = validateSignUpForm(form)
  errors.name = result.name
  errors.email = result.email
  errors.password = result.password
  if (errors.name || errors.email || errors.password) return
  submitError.value = ''
  loading.value = true
  try {
    const result = await signUp(form.email, form.password, form.name)
    if (result?.error) {
      submitError.value = result.error.message ?? 'Sign up failed. Please try again.'
    } else {
      await router.push('/dashboard')
    }
  } catch {
    submitError.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Create your page</h1>
      <p class="mt-1 text-sm text-warm-muted">Free, and takes about 2 minutes</p>
    </div>

    <AppCard>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="name"
          v-model="form.name"
          label="Your name"
          type="text"
          autocomplete="name"
          placeholder="Alex"
          :error="errors.name"
          required
        />
        <AppInput
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :error="errors.email"
          required
        />
        <AppInput
          id="password"
          v-model="form.password"
          label="Password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          helper="At least 8 characters"
          :error="errors.password"
          required
        />
        <p v-if="submitError" class="text-sm text-red-500">{{ submitError }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Create account
        </AppButton>
        <div class="relative flex items-center gap-3">
          <div class="h-px flex-1 bg-warm-border" />
          <span class="text-xs text-warm-muted">or</span>
          <div class="h-px flex-1 bg-warm-border" />
        </div>
        <SocialAuthButton provider="google" />
      </form>
    </AppCard>

    <p class="mt-4 text-center text-sm text-warm-muted">
      Already have an account?
      <NuxtLink to="/signin" class="font-medium text-sage-500 hover:text-sage-600">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
```

- [ ] **Step 2: Verify with Playwright**

Use Playwright to:
1. Navigate to `http://localhost:3000/signup`
2. Take a screenshot — confirm: heading "Create your page", name/email/password inputs, "Create account" button, Google button, "Sign in" link
3. Check console for errors

- [ ] **Step 3: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add sign up page`

---

## Task 10: Forgot Password Page

**Files:**
- Create: `app/pages/forgot-password.vue`

- [ ] **Step 1: Create forgot-password.vue**

```vue
<!-- app/pages/forgot-password.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { forgotPassword } = useAuth()

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await forgotPassword(email.value)
    if (result?.error) {
      error.value = result.error.message ?? 'Something went wrong. Please try again.'
    } else {
      sent.value = true
    }
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Forgot your password?</h1>
      <p class="mt-1 text-sm text-warm-muted">We'll send you a link to get back in</p>
    </div>

    <AppCard>
      <div v-if="sent" class="flex flex-col items-center gap-3 py-2 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <path d="m16 19 2 2 4-4" />
          </svg>
        </div>
        <p class="text-sm text-warm-text">
          Check your inbox — we sent a reset link to
          <strong class="font-medium">{{ email }}</strong>
        </p>
      </div>
      <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="email"
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Send reset link
        </AppButton>
      </form>
    </AppCard>

    <p class="mt-4 text-center text-sm text-warm-muted">
      <NuxtLink to="/signin" class="font-medium text-sage-500 hover:text-sage-600">
        Back to sign in
      </NuxtLink>
    </p>
  </div>
</template>
```

- [ ] **Step 2: Verify with Playwright**

Use Playwright to:
1. Navigate to `http://localhost:3000/forgot-password`
2. Take a screenshot — confirm heading, email input, "Send reset link" button, back link

- [ ] **Step 3: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add forgot password page`

---

## Task 11: Reset Password Page

**Files:**
- Create: `app/pages/reset-password.vue`

- [ ] **Step 1: Create reset-password.vue**

```vue
<!-- app/pages/reset-password.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { resetPassword } = useAuth()
const router = useRouter()
const route = useRoute()

const token = computed(() => (route.query.token as string) ?? '')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const result = await resetPassword(token.value, password.value)
    if (result?.error) {
      error.value = result.error.message ?? 'Reset failed. Your link may have expired.'
    } else {
      await router.push('/signin')
    }
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Set a new password</h1>
      <p class="mt-1 text-sm text-warm-muted">Make it something you'll remember</p>
    </div>

    <AppCard>
      <div v-if="!token" class="text-center">
        <p class="text-sm text-red-500">
          This link is invalid or has expired.
          <NuxtLink to="/forgot-password" class="font-medium text-sage-500 hover:text-sage-600">
            Request a new one.
          </NuxtLink>
        </p>
      </div>
      <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="password"
          v-model="password"
          label="New password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          helper="At least 8 characters"
          required
        />
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Update password
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
```

- [ ] **Step 2: Verify with Playwright**

Use Playwright to:
1. Navigate to `http://localhost:3000/reset-password` (no token — should show invalid link message)
2. Navigate to `http://localhost:3000/reset-password?token=test` — should show the password form
3. Take screenshots of both states

- [ ] **Step 3: Commit**

Use `commit-commands:commit` skill. Suggested message: `feat: add reset password page`

---

## Task 12: Full Playwright Verification Pass

Screenshot every auth page and check for console errors before declaring Phase 1 done.

**Files:** None — verification only.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Screenshot all four auth pages**

Use Playwright to navigate to and screenshot each:
1. `http://localhost:3000/signin`
2. `http://localhost:3000/signup`
3. `http://localhost:3000/forgot-password`
4. `http://localhost:3000/reset-password?token=testtoken`

For each page, also check `browser_console_messages` — there should be no errors.

- [ ] **Step 3: Verify navigation links work**

Use Playwright to:
1. On `/signin` — click "Sign up" link → confirm navigates to `/signup`
2. On `/signup` — click "Sign in" link → confirm navigates to `/signin`
3. On `/signin` — click "Forgot password?" → confirm navigates to `/forgot-password`
4. On `/forgot-password` — click "Back to sign in" → confirm navigates to `/signin`
5. On each page — click the "nice to meet you" logo → confirm navigates to `/`

- [ ] **Step 4: Run TypeScript check**

```bash
npx nuxi typecheck
```

Expected: no errors.

- [ ] **Step 5: Final commit**

Use `commit-commands:commit` skill. Suggested message: `chore: phase 1 complete — auth UI verified with Playwright`

---

## ⛔ STOP HERE — Design Review Required

Phase 1 is complete. **Do not proceed to Phase 2 until the design has been reviewed and approved.**

Present screenshots of all four auth pages to the user for review:
- `/signin`
- `/signup`
- `/forgot-password`
- `/reset-password?token=testtoken`

Ask the user:
1. Does the overall feel match the intended direction (warm, friendly, indie)?
2. Any colour, typography, or spacing adjustments?
3. Any copy changes (headings, button labels, helper text)?
4. Anything to change before continuing?

Lock in changes before Phase 2 begins.

---

## Self-Review Checklist

**Spec coverage:**
- [x] Design tokens (colors, font) — Task 1
- [x] AppButton (primary/secondary/ghost + loading) — Task 2
- [x] AppInput (label, error, helper) — Task 3
- [x] AppCard — Task 4
- [x] Better Auth client setup — Task 5
- [x] useAuth composable (signIn, signUp, signOut, forgotPassword, resetPassword) — Task 5
- [x] Reserved usernames list with TDD (isReservedUsername) — Task 5
- [x] Sign-up validation logic with TDD (validateSignUpForm) — Task 5
- [x] Signup page uses validateSignUpForm from validation.ts — Task 9
- [x] SocialAuthButton (Google) — Task 6
- [x] Auth layout with logo — Task 7
- [x] Sign in page — Task 8
- [x] Sign up page — Task 9
- [x] Forgot password page — Task 10
- [x] Reset password page — Task 11
- [x] Playwright verification of all pages — Task 12
- [x] Design review stop point — Task 12
