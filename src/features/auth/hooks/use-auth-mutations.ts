import { useMutation } from '@tanstack/react-query'

import * as authApi from '../api/auth-api'

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: authApi.logout,
  })
}
