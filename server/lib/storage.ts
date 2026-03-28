import { S3Client } from '@aws-sdk/client-s3'

const bucket = process.env.S3_BUCKET
if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !bucket) {
  throw new Error('S3 environment variables are not fully set')
}

export const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  // Required for both MinIO (local dev) and Cloudflare R2 (production)
  forcePathStyle: true,
})

export const BUCKET = bucket
