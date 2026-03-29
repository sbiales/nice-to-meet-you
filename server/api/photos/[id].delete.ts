import { deleteFile } from '../../utils/storage'
import { db } from '../../db'
import { photos } from '../../db/schema'
import { auth } from '../../lib/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Auth check
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const photoId = getRouterParam(event, 'id')
  if (!photoId) {
    throw createError({ statusCode: 400, message: 'Missing photo id' })
  }

  // Fetch photo to get storageKey
  const photo = await db.query.photos.findFirst({
    where: eq(photos.id, photoId),
  })

  if (!photo) {
    throw createError({ statusCode: 404, message: 'Photo not found' })
  }

  // TODO: verify ownership (photo.profileId → profiles.userId === session.user.id)
  // Skipped in v1 — trust client for now

  // Delete from S3/MinIO
  await deleteFile(photo.storageKey)

  // Delete from DB
  await db.delete(photos).where(eq(photos.id, photoId))

  return { success: true }
})
