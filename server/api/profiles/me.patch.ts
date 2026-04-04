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

  if (body?.taglinePrefix !== undefined) {
    if (body.taglinePrefix !== null && typeof body.taglinePrefix !== 'string') {
      throw createError({ statusCode: 400, message: 'taglinePrefix must be a string or null' })
    }
    updates.taglinePrefix = body.taglinePrefix
  }

  if (body?.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim() === '') {
      throw createError({ statusCode: 400, message: 'displayName must be a non-empty string' })
    }
    updates.displayName = body.displayName.trim()
  }

  if (body?.status !== undefined) {
    if (typeof body.status !== 'string' || !['active', 'paused', 'taken'].includes(body.status)) {
      throw createError({ statusCode: 400, message: 'status must be active, paused, or taken' })
    }
    updates.status = body.status as 'active' | 'paused' | 'taken'
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
