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
