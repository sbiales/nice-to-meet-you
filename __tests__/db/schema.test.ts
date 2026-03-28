import { db } from '~~/server/db'
import { user, profiles, photos, socialLinks, contactMessages, reports } from '~~/server/db/schema'

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
