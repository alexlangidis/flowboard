import { useMutation, useQueryClient } from '@tanstack/react-query'

import * as authApi from '../api/auth-api'

export const currentUserQueryKey = authApi.currentUserQueryKey

export function useLogoutMutation() {
  return useMutation({
    mutationFn: authApi.logout,
  })
}

export function useUpdateCurrentUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.updateCurrentUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
    },
  })
}
