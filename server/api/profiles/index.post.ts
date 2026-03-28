import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { validateUsername } from '../../../app/lib/username-validator'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const username = typeof body?.username === 'string' ? body.username.toLowerCase() : ''
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''

  if (!username || !displayName) {
    throw createError({ statusCode: 400, message: 'username and displayName are required' })
  }

  const usernameValidation = validateUsername(username)
  if (!usernameValidation.valid) {
    throw createError({ statusCode: 400, message: 'Invalid username format' })
  }

  if (displayName.length > 60) {
    throw createError({ statusCode: 400, message: 'Display name must be 60 characters or fewer' })
  }

  // Prevent duplicate profile for this user
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { id: true },
  })
  if (existingProfile) {
    throw createError({ statusCode: 409, message: 'Profile already exists for this account' })
  }

  // Check username availability
  const takenUsername = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
    columns: { id: true },
  })
  if (takenUsername) {
    throw createError({ statusCode: 409, message: 'Username is already taken' })
  }

  const [profile] = await db.insert(profiles).values({
    userId: session.user.id,
    username,
    displayName,
  }).returning()

  return profile
})
