export const RESERVED_USERNAMES = new Set([
  'signin',
  'signup',
  'login',
  'logout',
  'register',
  'dashboard',
  'api',
  'auth',
  'admin',
  'settings',
  'forgot-password',
  'reset-password',
  'profile',
  'account',
  'me',
  'user',
  'users',
  'help',
  'support',
  'about',
  'terms',
  'privacy',
  'contact',
])

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}
