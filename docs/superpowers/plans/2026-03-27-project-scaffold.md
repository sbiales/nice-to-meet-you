# Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready Nuxt 3 + TypeScript project with Drizzle ORM, Better Auth, S3-compatible storage, email, Docker Compose local dev, and Fly.io deployment config.

**Architecture:** Nuxt 3 with hybrid rendering (prerender `/`, CSR `/dashboard/**`, SSR `/:username`). All server-side logic lives under `server/` — database client, schema, auth, storage, and email are each isolated modules. Docker Compose provides local equivalents for every production backing service.

**Tech Stack:** Nuxt 3, TypeScript, Tailwind CSS, Drizzle ORM (`node-postgres`), Better Auth, AWS SDK v3 (S3/R2), Resend + Nodemailer, Vitest, Docker Compose, Fly.io

**Available tools (use as needed):**
- `context7` — look up current library docs before using any API (Nuxt, Better Auth, Drizzle, AWS SDK). Prefer this over assumptions about API shape.
- `typescript-lsp` — use to catch type errors without running a full build
- `commit-commands:commit` skill — use for all commits instead of raw `git commit`
- `code-simplifier` skill — run after each task to catch redundancy or clarity issues
- `security-guidance` — consult on auth and storage tasks

**TDD coverage:** Tasks 7 and 11 follow strict red-green TDD (failing test → implement → passing test). Config-only tasks (Tailwind, Docker, nuxt.config) use verification steps instead — TDD does not apply to configuration.

---

## File Map

```
nice-to-meet-you/
├── assets/css/main.css                          # Tailwind entry
├── layouts/
│   ├── default.vue                              # Public layout (used by / and /:username)
│   └── dashboard.vue                            # Auth-gated layout
├── pages/
│   ├── index.vue                                # Prerendered marketing page
│   ├── [username].vue                           # SSR public profile page
│   └── dashboard/
│       └── index.vue                            # CSR dashboard stub
├── server/
│   ├── db/
│   │   ├── index.ts                             # Drizzle client singleton
│   │   ├── schema/
│   │   │   ├── index.ts                         # Re-exports all schema
│   │   │   ├── auth.ts                          # Better Auth tables
│   │   │   ├── profiles.ts                      # profiles table + enums
│   │   │   ├── photos.ts                        # photos table
│   │   │   ├── social-links.ts                  # social_links table + platform enum
│   │   │   ├── contact-messages.ts              # contact_messages table
│   │   │   └── reports.ts                       # reports table
│   │   └── migrations/                          # Drizzle-generated migration files
│   ├── lib/
│   │   ├── auth.ts                              # Better Auth instance
│   │   ├── storage.ts                           # S3 client + bucket constant
│   │   └── email.ts                             # sendEmail() — Mailpit in dev, Resend in prod
│   ├── api/
│   │   └── auth/
│   │       └── [...all].ts                      # Better Auth catch-all handler
│   └── utils/
│       └── storage-url.ts                       # Constructs public URLs from storage keys
├── __tests__/
│   ├── db/schema.test.ts                        # Integration: schema CRUD against local Postgres
│   └── lib/storage.test.ts                      # Integration: S3 client against local MinIO
├── docker-compose.yml                           # postgres, minio, mailpit
├── Dockerfile                                   # Multi-stage Node.js build
├── fly.toml                                     # Fly.io deployment config
├── .dockerignore
├── drizzle.config.ts                            # Drizzle Kit config
├── nuxt.config.ts                               # Route rules, modules, runtime config
├── tailwind.config.ts
├── vitest.config.ts
├── .env.example                                 # Committed — documents required vars
└── .env.local                                   # Gitignored — local dev values
```

---

## Task 1: Initialize Nuxt 3 Project

**Files:**
- Create: `nuxt.config.ts`, `tsconfig.json`, `package.json`, `app.vue`

- [ ] **Step 1: Scaffold Nuxt 3 into the existing repo**

```bash
npx nuxi@latest init . --force
```

When prompted for package manager, select `npm`. When asked about git, select no (repo already exists).

- [ ] **Step 2: Verify TypeScript and dev server work**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000`, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: initialize Nuxt 3 project"
```

---

## Task 2: Configure Tailwind CSS

**Files:**
- Modify: `nuxt.config.ts`
- Create: `tailwind.config.ts`, `assets/css/main.css`

- [ ] **Step 1: Install Tailwind module**

```bash
npm install -D @nuxtjs/tailwindcss
```

- [ ] **Step 2: Add module to nuxt.config.ts**

Replace the `modules` array (or add it):

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
})
```

- [ ] **Step 3: Create Tailwind config**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Create CSS entry point**

```css
/* assets/css/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Add css to nuxt.config.ts**

```ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
})
```

- [ ] **Step 6: Verify Tailwind works**

Add a test class to `app.vue`:
```vue
<template>
  <div class="text-red-500">Hello</div>
</template>
```

Run `npm run dev` — text should be red.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add Tailwind CSS"
```

---

## Task 3: Configure nuxt.config.ts

**Files:**
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Write full nuxt.config.ts**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  nitro: {
    preset: 'node-server',
  },

  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    // All other routes (including /:username) default to SSR
  },

  runtimeConfig: {
    // Server-only — never exposed to client
    databaseUrl: '',
    s3Endpoint: '',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Bucket: '',
    resendApiKey: '',
    smtpHost: '',
    smtpPort: '',
    googleClientId: '',
    googleClientSecret: '',
    betterAuthSecret: '',
    public: {
      // Client-accessible config goes here
      appUrl: '',
    },
  },
})
```

- [ ] **Step 2: Verify build works with node-server preset**

```bash
npm run build
```

Expected: `.output/` directory created, `server/index.mjs` present.

- [ ] **Step 3: Commit**

```bash
git add nuxt.config.ts
git commit -m "chore: configure route rules, node-server preset, runtime config"
```

---

## Task 4: Docker Compose + Environment Files

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `.env.local`, `.gitignore` (update)

- [ ] **Step 1: Create docker-compose.yml**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nicetomeetyou
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  minio_data:
```

- [ ] **Step 2: Create .env.example**

```bash
# .env.example
# Copy to .env.local for local development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nicetomeetyou

# S3-compatible storage (MinIO locally, Cloudflare R2 in production)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=nicetomeetyou
S3_PUBLIC_URL=http://localhost:9000/nicetomeetyou

# Email (Mailpit locally, Resend in production)
# Set NODE_ENV=production to use Resend; otherwise Mailpit SMTP is used
SMTP_HOST=localhost
SMTP_PORT=1025
RESEND_API_KEY=re_your_key_here

# Auth
BETTER_AUTH_SECRET=change-me-to-a-random-32-char-string
NUXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 3: Create .env.local**

```bash
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nicetomeetyou
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=nicetomeetyou
S3_PUBLIC_URL=http://localhost:9000/nicetomeetyou
SMTP_HOST=localhost
SMTP_PORT=1025
RESEND_API_KEY=
BETTER_AUTH_SECRET=local-dev-secret-change-in-production
NUXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 4: Update .gitignore**

Ensure these lines exist in `.gitignore`:
```
.env.local
.env.production
.env*.local
.output
node_modules
```

- [ ] **Step 5: Start Docker services and verify**

```bash
docker compose up -d
docker compose ps
```

Expected: all three services show `running` / `healthy`.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "chore: add Docker Compose for local backing services"
```

---

## Task 5: Set Up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '~': new URL('.', import.meta.url).pathname,
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test to verify setup**

```ts
// __tests__/smoke.test.ts
describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts __tests__/smoke.test.ts package.json
git commit -m "chore: set up Vitest"
```

---

## Task 6: Drizzle ORM + Database Client

**Files:**
- Create: `drizzle.config.ts`, `server/db/index.ts`

- [ ] **Step 1: Install Drizzle**

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

- [ ] **Step 2: Create drizzle.config.ts**

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema/index.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 3: Create database client**

```ts
// server/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const db = drizzle(process.env.DATABASE_URL, { schema })
```

- [ ] **Step 4: Add migrate script to package.json**

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 5: Create empty schema index (required for drizzle.config.ts to resolve)**

```ts
// server/db/schema/index.ts
// Schema exports added in subsequent tasks
export {}
```

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts server/db/index.ts server/db/schema/index.ts package.json
git commit -m "chore: set up Drizzle ORM and database client"
```

---

## Task 7: Better Auth Database Schema

**Files:**
- Create: `server/db/schema/auth.ts`
- Modify: `server/db/schema/index.ts`

Better Auth requires specific table shapes. These match the Better Auth Drizzle adapter's expected schema exactly.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/db/schema.test.ts
import { db } from '~/server/db'
import { user } from '~/server/db/schema'
import { sql } from 'drizzle-orm'

describe('auth schema', () => {
  it('user table exists and is queryable', async () => {
    const result = await db.select().from(user).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/db/schema.test.ts
```

Expected: FAIL — `user` is not exported from schema.

- [ ] **Step 3: Create auth schema**

```ts
// server/db/schema/auth.ts
import {
  pgTable,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

- [ ] **Step 4: Export from schema index**

```ts
// server/db/schema/index.ts
export * from './auth'
```

- [ ] **Step 5: Run test — still fails (table not yet migrated)**

```bash
npm test __tests__/db/schema.test.ts
```

Expected: FAIL — table does not exist yet. That's correct — migration comes in Task 9.

- [ ] **Step 6: Commit**

```bash
git add server/db/schema/auth.ts server/db/schema/index.ts __tests__/db/schema.test.ts
git commit -m "feat: add Better Auth database schema"
```

---

## Task 8: Application Database Schema

**Files:**
- Create: `server/db/schema/profiles.ts`, `server/db/schema/photos.ts`, `server/db/schema/social-links.ts`, `server/db/schema/contact-messages.ts`, `server/db/schema/reports.ts`
- Modify: `server/db/schema/index.ts`

- [ ] **Step 1: Create profiles schema**

```ts
// server/db/schema/profiles.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core'
import { pgEnum } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const profileStatusEnum = pgEnum('profile_status', ['active', 'taken', 'paused'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  status: profileStatusEnum('status').notNull().default('active'),
  headerImageKey: text('header_image_key'),
  theme: jsonb('theme').notNull().default({}),
  blocks: jsonb('blocks').notNull().default([]),
  isContactable: boolean('is_contactable').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 2: Create photos schema**

```ts
// server/db/schema/photos.ts
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 3: Create social links schema**

```ts
// server/db/schema/social-links.ts
import { pgTable, uuid, text, boolean, integer } from 'drizzle-orm/pg-core'
import { pgEnum } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const socialPlatformEnum = pgEnum('social_platform', [
  'instagram',
  'spotify',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
  'website',
  'other',
])

export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  platform: socialPlatformEnum('platform').notNull(),
  url: text('url').notNull(),
  isVisible: boolean('is_visible').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})
```

- [ ] **Step 4: Create contact messages schema**

```ts
// server/db/schema/contact-messages.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  senderName: text('sender_name'),
  senderEmail: text('sender_email'),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 5: Create reports schema**

```ts
// server/db/schema/reports.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { user } from './auth'

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  reporterUserId: text('reporter_user_id').references(() => user.id, { onDelete: 'set null' }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 6: Export everything from schema index**

```ts
// server/db/schema/index.ts
export * from './auth'
export * from './profiles'
export * from './photos'
export * from './social-links'
export * from './contact-messages'
export * from './reports'
```

- [ ] **Step 7: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add server/db/schema/
git commit -m "feat: add application database schema (profiles, photos, social_links, contact_messages, reports)"
```

---

## Task 9: Generate and Run Initial Migration

**Files:**
- Create: `server/db/migrations/` (generated by Drizzle Kit)

- [ ] **Step 1: Confirm Docker Postgres is running**

```bash
docker compose ps postgres
```

Expected: `healthy`.

- [ ] **Step 2: Generate migration from schema**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nicetomeetyou npm run db:generate
```

Expected: migration file created in `server/db/migrations/`.

- [ ] **Step 3: Run migration**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nicetomeetyou npm run db:migrate
```

Expected: migration applied, all tables created.

- [ ] **Step 4: Run the schema test — should now pass**

```bash
npm test __tests__/db/schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Extend schema test to cover app tables**

```ts
// __tests__/db/schema.test.ts
import { db } from '~/server/db'
import { user, profiles, photos, socialLinks, contactMessages, reports } from '~/server/db/schema'

describe('database schema', () => {
  it('user table is queryable', async () => {
    const result = await db.select().from(user).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })

  it('profiles table is queryable', async () => {
    const result = await db.select().from(profiles).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })

  it('photos table is queryable', async () => {
    const result = await db.select().from(photos).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })

  it('social_links table is queryable', async () => {
    const result = await db.select().from(socialLinks).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })

  it('contact_messages table is queryable', async () => {
    const result = await db.select().from(contactMessages).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })

  it('reports table is queryable', async () => {
    const result = await db.select().from(reports).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })
})
```

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/db/migrations/ __tests__/db/schema.test.ts
git commit -m "feat: generate and apply initial database migration"
```

---

## Task 10: Better Auth Setup

**Files:**
- Create: `server/lib/auth.ts`, `server/api/auth/[...all].ts`

- [ ] **Step 1: Install Better Auth**

```bash
npm install better-auth
```

- [ ] **Step 2: Create auth instance**

```ts
// server/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is not set')
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
})

export type Auth = typeof auth
```

- [ ] **Step 3: Create the Better Auth API catch-all handler**

```ts
// server/api/auth/[...all].ts
import { auth } from '~/server/lib/auth'
import { toWebRequest } from 'h3'

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Verify auth endpoint responds**

Start the dev server (`npm run dev`) and in a separate terminal:

```bash
curl http://localhost:3000/api/auth/get-session
```

Expected: `{"session":null}` or similar JSON response (not a 404 or 500).

- [ ] **Step 6: Commit**

```bash
git add server/lib/auth.ts server/api/auth/
git commit -m "feat: set up Better Auth with Drizzle adapter"
```

---

## Task 11: S3-Compatible Storage Client

**Files:**
- Create: `server/lib/storage.ts`, `server/utils/storage-url.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/storage.test.ts
import { s3, BUCKET } from '~/server/lib/storage'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

describe('storage client', () => {
  it('can connect to S3-compatible storage', async () => {
    const response = await s3.send(new ListBucketsCommand({}))
    expect(response.Buckets).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/lib/storage.test.ts
```

Expected: FAIL — `s3` not exported from `server/lib/storage`.

- [ ] **Step 3: Install AWS SDK**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 4: Create storage client**

```ts
// server/lib/storage.ts
import { S3Client } from '@aws-sdk/client-s3'

if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_BUCKET) {
  throw new Error('S3 environment variables are not fully set')
}

export const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  // Required for MinIO path-style access
  forcePathStyle: true,
})

export const BUCKET = process.env.S3_BUCKET
```

- [ ] **Step 5: Create storage URL utility**

```ts
// server/utils/storage-url.ts
/**
 * Constructs a public URL from a storage key.
 * Never store full URLs in the database — always store keys and construct at runtime.
 */
export function storageUrl(key: string): string {
  const publicUrl = process.env.S3_PUBLIC_URL
  if (!publicUrl) throw new Error('S3_PUBLIC_URL is not set')
  return `${publicUrl.replace(/\/$/, '')}/${key}`
}
```

- [ ] **Step 6: Create the MinIO bucket (one-time local setup)**

MinIO needs the bucket to exist before we can use it. Run this once:

```bash
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/nicetomeetyou
docker compose exec minio mc anonymous set public local/nicetomeetyou
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npm test __tests__/lib/storage.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add server/lib/storage.ts server/utils/storage-url.ts __tests__/lib/storage.test.ts
git commit -m "feat: set up S3-compatible storage client"
```

---

## Task 12: Email Client

**Files:**
- Create: `server/lib/email.ts`

In development (`NODE_ENV !== 'production'`), email is sent via Mailpit SMTP so it can be inspected at `http://localhost:8025`. In production, Resend's API is used.

- [ ] **Step 1: Install dependencies**

```bash
npm install resend nodemailer
npm install -D @types/nodemailer
```

- [ ] **Step 2: Create email client**

```ts
// server/lib/email.ts
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

async function sendViaMailpit(options: SendEmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    ignoreTLS: true,
  })

  await transporter.sendMail({
    from: options.from ?? 'noreply@nicetomeetyou.local',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

async function sendViaResend(options: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: options.from ?? 'Nice To Meet You <noreply@nicetomeetyou.app>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return sendViaResend(options)
  }
  return sendViaMailpit(options)
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Smoke test email delivery to Mailpit**

Start Docker services if not running: `docker compose up -d`

Add a temporary test file (delete after verifying):
```ts
// __tests__/lib/email-manual.ts  (run manually, not part of CI)
import { sendEmail } from '~/server/lib/email'

await sendEmail({
  to: 'test@example.com',
  subject: 'Scaffold smoke test',
  html: '<p>If you can read this, Mailpit is working.</p>',
})

console.log('Email sent — check http://localhost:8025')
```

```bash
npx tsx __tests__/lib/email-manual.ts
```

Open `http://localhost:8025` — email should appear.

Delete `__tests__/lib/email-manual.ts` after verifying.

- [ ] **Step 5: Commit**

```bash
git add server/lib/email.ts
git commit -m "feat: set up email client (Mailpit in dev, Resend in production)"
```

---

## Task 13: Page Stubs and Layouts

**Files:**
- Create: `layouts/default.vue`, `layouts/dashboard.vue`, `pages/index.vue`, `pages/[username].vue`, `pages/dashboard/index.vue`
- Modify: `app.vue`

- [ ] **Step 1: Update app.vue to use layouts**

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 2: Create default layout**

```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-white">
    <slot />
  </div>
</template>
```

- [ ] **Step 3: Create dashboard layout**

```vue
<!-- layouts/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="border-b border-gray-200 bg-white px-6 py-4">
      <span class="font-semibold">Nice To Meet You</span>
    </nav>
    <main class="mx-auto max-w-4xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 4: Create marketing page stub**

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center">
    <h1 class="text-4xl font-bold">Nice To Meet You</h1>
    <p class="mt-4 text-gray-500">Your personal pitch page.</p>
  </div>
</template>
```

- [ ] **Step 5: Create public profile page stub**

```vue
<!-- pages/[username].vue -->
<script setup lang="ts">
const route = useRoute()
const username = route.params.username as string

// Tell search engines not to index profile pages
useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// OG tags — will be populated from profile data in a future task
useSeoMeta({
  title: `${username} — Nice To Meet You`,
  ogTitle: `${username} — Nice To Meet You`,
})

definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center">
    <p class="text-gray-400">Profile page for @{{ username }}</p>
  </div>
</template>
```

- [ ] **Step 6: Create dashboard stub**

```vue
<!-- pages/dashboard/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', ssr: false })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="mt-2 text-gray-500">Manage your profile here.</p>
  </div>
</template>
```

- [ ] **Step 7: Verify all routes load**

```bash
npm run dev
```

Check:
- `http://localhost:3000/` — renders marketing page
- `http://localhost:3000/testuser` — renders profile stub with username
- `http://localhost:3000/dashboard` — renders dashboard stub

- [ ] **Step 8: Commit**

```bash
git add app.vue layouts/ pages/
git commit -m "feat: add page stubs and layouts"
```

---

## Task 14: Dockerfile

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

```
node_modules
.output
.nuxt
.git
.env*
*.local
docs
__tests__
```

- [ ] **Step 2: Create multi-stage Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

- [ ] **Step 3: Verify Docker build succeeds**

```bash
docker build -t nice-to-meet-you:local .
```

Expected: build completes, image created.

- [ ] **Step 4: Verify the container runs**

```bash
docker run --rm -p 3001:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/nicetomeetyou \
  -e BETTER_AUTH_SECRET=test \
  -e NUXT_PUBLIC_APP_URL=http://localhost:3001 \
  -e S3_ENDPOINT=http://host.docker.internal:9000 \
  -e S3_ACCESS_KEY=minioadmin \
  -e S3_SECRET_KEY=minioadmin \
  -e S3_BUCKET=nicetomeetyou \
  -e S3_PUBLIC_URL=http://localhost:9000/nicetomeetyou \
  nice-to-meet-you:local
```

Open `http://localhost:3001` — marketing page should render.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "chore: add multi-stage Dockerfile"
```

---

## Task 15: Fly.io Deployment Configuration

**Files:**
- Create: `fly.toml`

- [ ] **Step 1: Install Fly CLI (if not installed)**

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

- [ ] **Step 2: Create fly.toml**

```toml
# fly.toml
app = 'nice-to-meet-you'
primary_region = 'iad'

[build]

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

- [ ] **Step 3: Document secrets that must be set in Fly**

Add to `README.md`:

```markdown
## Deployment (Fly.io)

After running `fly launch`, set production secrets:

```bash
fly secrets set DATABASE_URL="..."
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
fly secrets set S3_ACCESS_KEY="..."
fly secrets set S3_SECRET_KEY="..."
fly secrets set S3_BUCKET="nicetomeetyou"
fly secrets set S3_PUBLIC_URL="https://your-r2-public-url"
fly secrets set RESEND_API_KEY="re_..."
fly secrets set NUXT_PUBLIC_APP_URL="https://your-app.fly.dev"
```
```

- [ ] **Step 4: Run final full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Final commit**

```bash
git add fly.toml README.md
git commit -m "chore: add Fly.io deployment config and deployment docs"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Nuxt 3 + TypeScript — Task 1
- [x] Tailwind CSS — Task 2
- [x] node-server preset — Task 3
- [x] Hybrid routing (prerender `/`, CSR `/dashboard/**`, SSR `/:username`) — Task 3
- [x] Docker Compose (postgres, minio, mailpit) — Task 4
- [x] .env.example + .env.local — Task 4
- [x] Vitest — Task 5
- [x] Drizzle ORM + db client — Task 6
- [x] Better Auth schema — Task 7
- [x] App schema (profiles, photos, social_links, contact_messages, reports) — Task 8
- [x] Block-based JSONB content on profiles — Task 8
- [x] Initial migration — Task 9
- [x] Better Auth instance + catch-all handler — Task 10
- [x] S3 storage client (MinIO locally / R2 in prod) — Task 11
- [x] storage-url utility (keys not URLs in DB) — Task 11
- [x] Email client (Mailpit in dev / Resend in prod) — Task 12
- [x] Page stubs (index, [username], dashboard) — Task 13
- [x] Layouts (default, dashboard) — Task 13
- [x] noindex on profile pages — Task 13
- [x] Dockerfile — Task 14
- [x] fly.toml — Task 15
