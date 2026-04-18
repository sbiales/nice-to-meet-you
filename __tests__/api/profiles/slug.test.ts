import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~~/server/db'
import { profiles } from '~~/server/db/schema/profiles'
import { user } from '~~/server/db/schema/auth'
import { generateSlug } from '~~/server/lib/slug'

const TEST_USER_IDS = ['slug-gen-user-1', 'slug-gen-user-2']
const TAKEN_SLUG = 'slugtest_taken'

beforeAll(async () => {
  await db.insert(user).values([
    { id: TEST_USER_IDS[0], name: 'Slug Test 1', email: 'slugtest1@example.com', emailVerified: false, createdAt: new Date(), updatedAt: new Date() },
    { id: TEST_USER_IDS[1], name: 'Slug Test 2', email: 'slugtest2@example.com', emailVerified: false, createdAt: new Date(), updatedAt: new Date() },
  ]).onConflictDoNothing()

  await db.insert(profiles).values({
    userId: TEST_USER_IDS[0],
    username: 'slugtest_holder',
    slug: TAKEN_SLUG,
    displayName: 'Slug Holder',
  }).onConflictDoNothing()
})

afterAll(async () => {
  await db.delete(profiles).where(inArray(profiles.userId, TEST_USER_IDS))
  await db.delete(user).where(inArray(user.id, TEST_USER_IDS))
})

describe('generateSlug', () => {
  it('returns username when slug is not taken', async () => {
    const slug = await generateSlug('completely_unique_slug_xyz')
    expect(slug).toBe('completely_unique_slug_xyz')
  })

  it('returns username2 when username slug is taken', async () => {
    const slug = await generateSlug(TAKEN_SLUG)
    expect(slug).toBe(`${TAKEN_SLUG}2`)
  })
})
