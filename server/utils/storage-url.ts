/**
 * Constructs a public URL from a storage key.
 * Never store full URLs in the database — always store keys and construct at runtime.
 */
export function storageUrl(key: string): string {
  const publicUrl = process.env.S3_PUBLIC_URL
  if (!publicUrl) throw new Error('S3_PUBLIC_URL is not set')
  return `${publicUrl.replace(/\/$/, '')}/${key}`
}
