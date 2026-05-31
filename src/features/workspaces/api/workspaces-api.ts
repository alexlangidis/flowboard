import { apiClient } from '@/lib/api-client'

import type { Workspace } from '../types'

type WorkspacesResponse = {
  success: true
  data: {
    workspaces: Workspace[]
  }
}

type WorkspaceResponse = {
  success: true
  data: {
    workspace: Workspace
  }
}

type DeleteWorkspaceResponse = {
  success: true
  data: {
    deletedWorkspaceId: string
  }
}

export type WorkspaceInput = {
  name: string
}

export function listWorkspaces() {
  return apiClient.get<WorkspacesResponse>('/api/workspaces', {
    credentials: 'include',
  })
}

export function createWorkspace(input: WorkspaceInput) {
  return apiClient.post<WorkspaceResponse, WorkspaceInput>(
    '/api/workspaces',
    input,
    {
      credentials: 'include',
    },
  )
}

export function updateWorkspace(workspaceId: string, input: WorkspaceInput) {
  return apiClient.patch<WorkspaceResponse, WorkspaceInput>(
    `/api/workspaces/${workspaceId}`,
    input,
    {
      credentials: 'include',
    },
  )
}

export function deleteWorkspace(workspaceId: string) {
  return apiClient.delete<DeleteWorkspaceResponse>(
    `/api/workspaces/${workspaceId}`,
    {
      credentials: 'include',
    },
  )
}
