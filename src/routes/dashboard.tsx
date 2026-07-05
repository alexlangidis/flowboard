import { createFileRoute } from '@tanstack/react-router'
import { Plus, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireAuthenticatedUser } from '@/features/auth/api/route-guards'
import { BoardCard } from '@/features/boards/components/board-card'
import { CreateBoardDialog } from '@/features/boards/components/create-board-dialog'
import { CreateBoardTile } from '@/features/boards/components/create-board-tile'
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'
import { WorkspacePageHeader } from '@/features/workspaces/components/workspace-page-header'
import { WorkspaceShell } from '@/features/workspaces/components/workspace-shell'
import { WorkspaceStats } from '@/features/workspaces/components/workspace-stats'
import { useActiveWorkspace } from '@/features/workspaces/hooks/use-active-workspace'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuthenticatedUser,
  component: DashboardPage,
})

function DashboardPage() {
  const boardsQuery = useBoardsQuery()
  const boards = boardsQuery.data?.data.boards ?? []
  const { activeWorkspaceId, workspaceBoards, workspaceName } =
    useActiveWorkspace(boards)
  const favoriteBoards = workspaceBoards.filter((board) => board.isStarred)
  const standardBoards =
    favoriteBoards.length > 0
      ? workspaceBoards.filter((board) => !board.isStarred)
      : workspaceBoards

  return (
    <WorkspaceShell
      activeItem="boards"
      boards={workspaceBoards}
      workspaceName={workspaceName}
    >
      <div className="flex flex-col gap-8">
        <WorkspacePageHeader
          eyebrow={workspaceName}
          title="Boards"
          description="Pick up recent work, manage favorites, or spin up a new board for the next project."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void boardsQuery.refetch()}
              >
                <RefreshCw data-icon="inline-start" />
                Refresh
              </Button>
              <CreateBoardDialog workspaceId={activeWorkspaceId ?? undefined}>
                <Button size="sm">
                  <Plus data-icon="inline-start" />
                  New board
                </Button>
              </CreateBoardDialog>
            </>
          }
        />

        <WorkspaceStats
          items={[
            { label: 'Total boards', value: workspaceBoards.length },
            {
              label: 'Favorites',
              value: favoriteBoards.length,
              accent: true,
            },
            { label: 'Workspace', value: workspaceName },
            { label: 'Team members', value: 1 },
          ]}
        />

        {boardsQuery.isLoading ? (
          <BoardGridSkeleton />
        ) : boardsQuery.isError ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Unable to load boards</CardTitle>
              <CardDescription>
                Check that the Worker API is running, then try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => void boardsQuery.refetch()}
              >
                <RefreshCw data-icon="inline-start" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-8">
            {favoriteBoards.length > 0 ? (
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-sm bg-flow-yellow"
                  />
                  <h2 className="text-base font-semibold">Favorites</h2>
                  <Badge variant="secondary">{favoriteBoards.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {favoriteBoards.map((board) => (
                    <BoardCard key={board.id} board={board} featured />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">All boards</h2>
                <p className="text-sm text-muted-foreground">
                  {workspaceBoards.length}{' '}
                  {workspaceBoards.length === 1 ? 'board' : 'boards'} in
                  workspace
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {standardBoards.map((board) => (
                  <BoardCard key={board.id} board={board} />
                ))}
                <CreateBoardTile>
                  <CreateBoardDialog workspaceId={activeWorkspaceId ?? undefined}>
                    <Button variant="outline" size="sm" className="mt-1">
                      New board
                    </Button>
                  </CreateBoardDialog>
                </CreateBoardTile>
              </div>
            </section>
          </div>
        )}
      </div>
    </WorkspaceShell>
  )
}

function BoardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="h-1 bg-muted" />
          <CardHeader>
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
