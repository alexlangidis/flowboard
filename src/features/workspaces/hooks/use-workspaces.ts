import { useQuery } from '@tanstack/react-query'

import * as workspacesApi from '../api/workspaces-api'

export const workspacesQueryKey = ['workspaces'] as const

export function useWorkspacesQuery(enabled = true) {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: workspacesApi.listWorkspaces,
    enabled,
  })
}
