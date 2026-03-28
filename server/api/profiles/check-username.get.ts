import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { validateUsername } from '../../../app/lib/username-validator'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const username = String(query.username ?? '').toLowerCase()

  const validation = validateUsername(username)
  if (!validation.valid) {
    return { available: false }
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
    columns: { id: true },
  })

  return { available: !existing }
})
