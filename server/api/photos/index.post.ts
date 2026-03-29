import { uploadFile } from '../../utils/storage'
import { db } from '../../db'
import { photos } from '../../db/schema'
import { auth } from '../../lib/auth'
import { randomUUID } from 'crypto'
import { readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  // Auth check
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Parse multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No form data' })
  }

  const filePart = formData.find((p) => p.name === 'file')
  const profileIdPart = formData.find((p) => p.name === 'profileId')

  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'Missing file' })
  }
  if (!profileIdPart?.data) {
    throw createError({ statusCode: 400, message: 'Missing profileId' })
  }

  const profileId = profileIdPart.data.toString()
  const ext = filePart.filename.split('.').pop() ?? 'jpg'
  const storageKey = `photos/${profileId}/${randomUUID()}.${ext}`

  // Validate file size (5MB max)
  if (filePart.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 413, message: 'File too large (max 5MB)' })
  }

  // Validate content type
  const contentType = filePart.type ?? 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 415, message: 'Only image files allowed' })
  }

  // Upload to S3/MinIO
  await uploadFile(storageKey, filePart.data, contentType)

  // Insert into DB
  const rows = await db
    .insert(photos)
    .values({
      id: randomUUID(),
      profileId,
      storageKey,
      sortOrder: 0,
    })
    .returning()

  const photo = rows[0]
  if (!photo) {
    throw createError({ statusCode: 500, message: 'Failed to insert photo record' })
  }

  return { id: photo.id, storageKey: photo.storageKey }
})
