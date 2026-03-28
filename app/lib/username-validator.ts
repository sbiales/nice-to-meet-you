import { isReservedUsername } from './reserved-usernames'

export type UsernameValidationResult =
  | { valid: true }
  | { valid: false; reason: 'too_short' | 'too_long' | 'invalid_chars' | 'reserved' }

export function validateUsername(username: string): UsernameValidationResult {
  if (username.length < 3) return { valid: false, reason: 'too_short' }
  if (username.length > 30) return { valid: false, reason: 'too_long' }
  if (!/^[a-z0-9_]+$/.test(username)) return { valid: false, reason: 'invalid_chars' }
  if (isReservedUsername(username)) return { valid: false, reason: 'reserved' }
  return { valid: true }
}

export function usernameErrorMessage(result: UsernameValidationResult): string {
  if (result.valid) return ''
  switch (result.reason) {
    case 'too_short': return 'Username must be at least 3 characters'
    case 'too_long': return 'Username must be 30 characters or fewer'
    case 'invalid_chars': return 'Usernames can only contain lowercase letters, numbers, and underscores'
    case 'reserved': return 'That username is not available'
  }
}
