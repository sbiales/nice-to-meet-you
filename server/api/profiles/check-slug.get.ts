import { eq, and, ne } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { validateUsername } from '../../../app/lib/username-validator'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const slug = String(query.slug ?? '').toLowerCase()

  const validation = validateUsername(slug)
  if (!validation.valid) {
    return { available: false }
  }

  const existing = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.slug, slug),
      ne(profiles.userId, session.user.id),
    ),
    columns: { id: true },
  })

  return { available: !existing }
})
