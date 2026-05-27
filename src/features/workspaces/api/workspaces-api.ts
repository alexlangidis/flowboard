import { apiClient } from '@/lib/api-client'

import type { Workspace } from '../types'

type WorkspacesResponse = {
  success: true
  data: {
    workspaces: Workspace[]
  }
}

export function listWorkspaces() {
  return apiClient.get<WorkspacesResponse>('/api/workspaces', {
    credentials: 'include',
  })
}
