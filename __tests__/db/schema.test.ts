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

  it('slug column exists and is unique', async () => {
    const result = await db.query.profiles.findFirst()
    if (result) {
      expect(typeof result.slug).toBe('string')
      expect(result.slug.length).toBeGreaterThan(0)
    }
    // Duplicate slug insert should throw
    const rows = await db.select().from(profiles).limit(1)
    if (rows.length > 0) {
      await expect(
        db.insert(profiles).values({
          userId: 'dupe-slug-test',
          username: 'dupe_slug_username_test',
          slug: rows[0].slug,
          displayName: 'Dupe Slug',
        })
      ).rejects.toThrow()
    }
  })
})
