import { db } from '~/server/db'
import { user } from '~/server/db/schema'

describe('auth schema', () => {
  it('user table exists and is queryable', async () => {
    const result = await db.select().from(user).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })
})
