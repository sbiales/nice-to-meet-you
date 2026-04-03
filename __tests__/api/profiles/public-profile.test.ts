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
