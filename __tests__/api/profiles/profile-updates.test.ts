// __tests__/api/profiles/profile-updates.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { profiles } from '~~/server/db/schema/profiles'
import { user } from '~~/server/db/schema/auth'
import type { AnyBlock } from '~/types/blocks'
import type { Theme } from '~/types/theme'

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

describe('profile status persistence', () => {
  it('updates status to paused', async () => {
    await db.update(profiles)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })

    expect(row?.status).toBe('paused')
  })

  it('updates status to taken', async () => {
    await db.update(profiles)
      .set({ status: 'taken', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })

    expect(row?.status).toBe('taken')
  })

  it('updates status back to active', async () => {
    await db.update(profiles)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(profiles.userId, TEST_USER_ID))

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, TEST_USER_ID),
    })

    expect(row?.status).toBe('active')
  })
})
