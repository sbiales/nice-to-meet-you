import { describe, it, expect } from 'vitest'
import { validateUsername, usernameErrorMessage } from '~/lib/username-validator'

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('john')).toEqual({ valid: true })
    expect(validateUsername('john_doe')).toEqual({ valid: true })
    expect(validateUsername('user123')).toEqual({ valid: true })
    expect(validateUsername('abc')).toEqual({ valid: true })
    expect(validateUsername('a'.repeat(30))).toEqual({ valid: true })
  })

  it('rejects usernames shorter than 3 characters', () => {
    expect(validateUsername('')).toEqual({ valid: false, reason: 'too_short' })
    expect(validateUsername('ab')).toEqual({ valid: false, reason: 'too_short' })
  })

  it('rejects usernames longer than 30 characters', () => {
    expect(validateUsername('a'.repeat(31))).toEqual({ valid: false, reason: 'too_long' })
  })

  it('rejects uppercase letters', () => {
    expect(validateUsername('John')).toEqual({ valid: false, reason: 'invalid_chars' })
    expect(validateUsername('JOHN')).toEqual({ valid: false, reason: 'invalid_chars' })
  })

  it('rejects hyphens, spaces, and special characters', () => {
    expect(validateUsername('john-doe')).toEqual({ valid: false, reason: 'invalid_chars' })
    expect(validateUsername('john doe')).toEqual({ valid: false, reason: 'invalid_chars' })
    expect(validateUsername('john.doe')).toEqual({ valid: false, reason: 'invalid_chars' })
  })

  it('rejects reserved usernames', () => {
    expect(validateUsername('admin')).toEqual({ valid: false, reason: 'reserved' })
    expect(validateUsername('dashboard')).toEqual({ valid: false, reason: 'reserved' })
    expect(validateUsername('api')).toEqual({ valid: false, reason: 'reserved' })
    expect(validateUsername('signin')).toEqual({ valid: false, reason: 'reserved' })
  })
})

describe('usernameErrorMessage', () => {
  it('returns empty string for valid result', () => {
    expect(usernameErrorMessage({ valid: true })).toBe('')
  })

  it('returns message for too_short', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'too_short' }))
      .toContain('3 characters')
  })

  it('returns message for too_long', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'too_long' }))
      .toContain('30 characters')
  })

  it('returns message for invalid_chars', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'invalid_chars' }))
      .toContain('letters, numbers')
  })

  it('returns message for reserved', () => {
    expect(usernameErrorMessage({ valid: false, reason: 'reserved' }))
      .toContain('not available')
  })
})
