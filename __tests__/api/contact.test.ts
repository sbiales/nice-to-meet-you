import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { checkRateLimit } from '~~/server/utils/rate-limit'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { profiles } from '~~/server/db/schema/profiles'
import { user } from '~~/server/db/schema/auth'
import { contactMessages } from '~~/server/db/schema/contact-messages'

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
    slug: TEST_USERNAME,
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
