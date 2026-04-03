import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  if (!username) {
    throw createError({ statusCode: 400, message: 'Username required' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })

  if (!profile || profile.deletedAt) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  return {
    ...profile,
    blocks: profile.status === 'paused' ? [] : profile.blocks,
  }
})
