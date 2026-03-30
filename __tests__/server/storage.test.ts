import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('getPublicUrl', () => {
  beforeEach(() => {
    vi.stubEnv('S3_PUBLIC_URL', 'http://localhost:9000/nicetomeetyou')
  })

  it('constructs public URL from a storage key', async () => {
    const { getPublicUrl } = await import('../../server/utils/storage')
    expect(getPublicUrl('photos/profile-1/abc.jpg')).toBe(
      'http://localhost:9000/nicetomeetyou/photos/profile-1/abc.jpg'
    )
  })

  it('strips trailing slash from S3_PUBLIC_URL before joining', async () => {
    vi.stubEnv('S3_PUBLIC_URL', 'http://localhost:9000/nicetomeetyou/')
    const { getPublicUrl } = await import('../../server/utils/storage')
    const url = getPublicUrl('photos/profile-1/abc.jpg')
    expect(url).not.toMatch(/\/\/photos/)
    expect(url).toBe('http://localhost:9000/nicetomeetyou/photos/profile-1/abc.jpg')
  })
})
