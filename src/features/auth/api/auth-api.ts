import { apiClient } from '@/lib/api-client'

import type { AuthResponse } from '../types'
import type { LoginInput, RegisterInput } from '../schemas/auth-schemas'

export function login(input: LoginInput) {
  return apiClient.post<AuthResponse, LoginInput>('/api/auth/login', input, {
    credentials: 'include',
  })
}

export function register(input: RegisterInput) {
  return apiClient.post<AuthResponse, RegisterInput>(
    '/api/auth/register',
    input,
    {
      credentials: 'include',
    },
  )
}

export function getCurrentUser() {
  return apiClient.get<AuthResponse>('/api/auth/me', {
    credentials: 'include',
  })
}

export function logout() {
  return apiClient.post<{ success: true; data: { ok: true } }, undefined>(
    '/api/auth/logout',
    undefined,
    { credentials: 'include' },
  )
}
