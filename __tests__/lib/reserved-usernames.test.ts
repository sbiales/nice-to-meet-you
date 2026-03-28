import { isReservedUsername } from '~/lib/reserved-usernames'

describe('isReservedUsername', () => {
  it('returns true for reserved slugs', () => {
    expect(isReservedUsername('signin')).toBe(true)
    expect(isReservedUsername('signup')).toBe(true)
    expect(isReservedUsername('dashboard')).toBe(true)
    expect(isReservedUsername('admin')).toBe(true)
    expect(isReservedUsername('api')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isReservedUsername('SIGNIN')).toBe(true)
    expect(isReservedUsername('Dashboard')).toBe(true)
  })

  it('returns false for regular usernames', () => {
    expect(isReservedUsername('alex')).toBe(false)
    expect(isReservedUsername('siena')).toBe(false)
    expect(isReservedUsername('coolperson')).toBe(false)
  })
})
