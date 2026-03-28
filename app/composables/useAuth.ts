import { authClient } from '~/lib/auth-client'

export function useAuth() {
  const session = authClient.useSession()

  async function signIn(email: string, password: string) {
    return authClient.signIn.email({ email, password })
  }

  async function signUp(email: string, password: string, name: string) {
    return authClient.signUp.email({ email, password, name })
  }

  async function signOut() {
    return authClient.signOut()
  }

  async function forgotPassword(email: string) {
    return authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })
  }

  async function resetPassword(token: string, newPassword: string) {
    return authClient.resetPassword({ newPassword, token })
  }

  return { session, signIn, signUp, signOut, forgotPassword, resetPassword }
}
