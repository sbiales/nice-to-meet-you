// server/api/profiles/header-image.post.ts
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { auth } from '../../lib/auth'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { uploadFile } from '../../utils/storage'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No form data' })
  }

  const filePart = formData.find((p) => p.name === 'file')
  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'Missing file' })
  }

  const contentType = filePart.type ?? 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw createError({ statusCode: 415, message: 'Only jpeg, png, webp, or gif allowed' })
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, message: 'File too large (max 5 MB)' })
  }

  const ext = filePart.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storageKey = `headers/${profile.id}/${randomUUID()}.${ext}`

  await uploadFile(storageKey, filePart.data, contentType)

  await db.update(profiles)
    .set({ headerImageKey: storageKey, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))

  return { storageKey }
})
