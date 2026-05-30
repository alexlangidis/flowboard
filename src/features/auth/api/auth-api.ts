import { authClient } from '@/lib/auth-client'

import type { AuthResponse } from '../types'

export async function getCurrentUser(): Promise<AuthResponse> {
  const session = await authClient.getSession()

  if (!session.data?.user) {
    return { success: true, data: { user: null } }
  }

  const { user } = session.data

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
  }
}

export async function logout() {
  const result = await authClient.signOut()

  if (result.error) {
    throw new Error(result.error.message ?? 'Unable to sign out.')
  }

  return { success: true, data: { ok: true } } as const
}
