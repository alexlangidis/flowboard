import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as workspacesApi from '../api/workspaces-api'

export const workspacesQueryKey = ['workspaces'] as const
const boardsQueryKey = ['boards'] as const

export function useWorkspacesQuery(enabled = true) {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: workspacesApi.listWorkspaces,
    enabled,
  })
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workspacesApi.createWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      input,
      workspaceId,
    }: {
      input: workspacesApi.WorkspaceInput
      workspaceId: string
    }) => workspacesApi.updateWorkspace(workspaceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workspacesApi.deleteWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}
