import { authClient } from '@/lib/auth-client'
import { apiClient } from '@/lib/api-client'
import type { QueryClient } from '@tanstack/react-query'

import type { AuthResponse } from '../types'

export const currentUserQueryKey = ['auth', 'me'] as const

export async function refreshAuthSession() {
  return authClient.getSession({
    query: { disableCookieCache: true },
  })
}

export async function prefetchCurrentUser(queryClient: QueryClient) {
  await refreshAuthSession()
  await queryClient.fetchQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  })
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const session = await authClient.getSession()

  if (!session.data?.user) {
    return { success: true, data: { user: null } }
  }

  try {
    return await apiClient.get<AuthResponse>('/api/auth/me', {
      credentials: 'include',
    })
  } catch {
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
}

export function updateCurrentUser(input: { name: string }) {
  return apiClient.patch<AuthResponse, { name: string }>(
    '/api/auth/me',
    input,
    {
      credentials: 'include',
    },
  )
}

export async function logout() {
  const result = await authClient.signOut()

  if (result.error) {
    throw new Error(result.error.message ?? 'Unable to sign out.')
  }

  return { success: true, data: { ok: true } } as const
}
