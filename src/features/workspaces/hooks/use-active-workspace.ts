import { useMemo } from 'react'

import type { Board } from '@/features/boards/types'
import { useUiStore } from '@/stores/ui-store'

import { useWorkspacesQuery } from './use-workspaces'

export function useActiveWorkspace(boards: Board[] = []) {
  const workspacesQuery = useWorkspacesQuery()
  const activeWorkspaceId = useUiStore((state) => state.activeWorkspaceId)
  const setActiveWorkspaceId = useUiStore((state) => state.setActiveWorkspaceId)
  const workspaces = workspacesQuery.data?.data.workspaces ?? []
  const workspace =
    workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0]
  const workspaceBoards = useMemo(() => {
    if (!workspace) {
      return boards
    }

    return boards.filter((board) => board.workspaceId === workspace.id)
  }, [boards, workspace])
  const workspaceName =
    workspace?.name ??
    workspaceBoards[0]?.workspaceName ??
    boards[0]?.workspaceName ??
    'Workspace'

  return {
    activeWorkspaceId: workspace?.id ?? null,
    setActiveWorkspaceId,
    workspace,
    workspaceBoards,
    workspaceName,
    workspaces,
    workspacesQuery,
  }
}
