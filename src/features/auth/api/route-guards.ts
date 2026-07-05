import { redirect } from '@tanstack/react-router'

import { getCurrentUser } from './auth-api'

export async function redirectAuthenticatedUser() {
  const response = await getCurrentUser()

  if (response.data.user) {
    throw redirect({ to: '/dashboard' })
  }
}

export async function requireAuthenticatedUser() {
  try {
    const response = await getCurrentUser()

    if (!response.data.user) {
      throw redirect({ to: '/login' })
    }

    return response.data.user
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    throw redirect({ to: '/login' })
  }
}
