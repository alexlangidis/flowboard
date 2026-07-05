import { authClient } from '@/lib/auth-client'
import { apiClient } from '@/lib/api-client'
import type { QueryClient } from '@tanstack/react-query'

import type { AuthResponse } from '../types'

export const currentUserQueryKey = ['auth', 'me'] as const

const forceFetchSession = {
  fetchOptions: { headers: { 'X-Force-Fetch': 'true' } },
} as const

export async function refreshAuthSession() {
  return authClient.getSession(forceFetchSession)
}

export async function waitForAuthSession(maxAttempts = 6, delayMs = 100) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await authClient.getSession(forceFetchSession)

    if (session.data?.user) {
      return session
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return null
}

type SignInPayload = {
  token?: string | null
  user?: {
    id: string
    email: string
    name: string
  } | null
}

export async function completeAuthRedirect(signInPayload?: SignInPayload) {
  const session = await waitForAuthSession()

  if (!session?.data?.user && signInPayload?.token && signInPayload.user) {
    try {
      await apiClient.get<AuthResponse>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${signInPayload.token}`,
        },
        credentials: 'include',
      })
    } catch {
      // The route guard can still fall back to the Neon Auth session user.
    }
  }

  window.location.assign('/dashboard')
}

export async function prefetchCurrentUser(queryClient: QueryClient) {
  await refreshAuthSession()
  await queryClient.fetchQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  })
}

export async function getCurrentUser(): Promise<AuthResponse> {
  let session = await authClient.getSession()

  if (!session.data?.user) {
    session = await authClient.getSession(forceFetchSession)
  }

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
