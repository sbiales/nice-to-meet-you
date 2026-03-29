// server/api/profiles/me.patch.ts
import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body?.blocks !== undefined) {
    if (!Array.isArray(body.blocks)) {
      throw createError({ statusCode: 400, message: 'blocks must be an array' })
    }
    updates.blocks = body.blocks
  }

  if (body?.theme !== undefined) {
    if (typeof body.theme !== 'object' || body.theme === null) {
      throw createError({ statusCode: 400, message: 'theme must be an object' })
    }
    updates.theme = body.theme
  }

  const [updated] = await db.update(profiles)
    .set(updates)
    .where(eq(profiles.userId, session.user.id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  return updated
})
