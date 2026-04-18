import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '~~/server/utils/rate-limit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const ip = `allow-${Date.now()}`
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true)
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true)
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true)
  })

  it('blocks the request that exceeds the limit', () => {
    const ip = `block-${Date.now()}`
    checkRateLimit(ip, 3, 60_000)
    checkRateLimit(ip, 3, 60_000)
    checkRateLimit(ip, 3, 60_000)
    expect(checkRateLimit(ip, 3, 60_000)).toBe(false)
  })

  it('allows requests again after the window expires', async () => {
    const ip = `expire-${Date.now()}`
    checkRateLimit(ip, 1, 50)
    expect(checkRateLimit(ip, 1, 50)).toBe(false)
    await new Promise(r => setTimeout(r, 60))
    expect(checkRateLimit(ip, 1, 50)).toBe(true)
  })
})
