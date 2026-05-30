import { createFileRoute } from '@tanstack/react-router'
import { Clock, RefreshCw } from 'lucide-react'

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
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'
import { WorkspaceShell } from '@/features/workspaces/components/workspace-shell'
import { useWorkspacesQuery } from '@/features/workspaces/hooks/use-workspaces'

export const Route = createFileRoute('/recent')({
  beforeLoad: requireAuthenticatedUser,
  component: RecentPage,
})

function RecentPage() {
  const boardsQuery = useBoardsQuery()
  const workspacesQuery = useWorkspacesQuery()
  const boards = boardsQuery.data?.data.boards ?? []
  const recentBoards = [...boards].sort(
    (firstBoard, secondBoard) =>
      new Date(secondBoard.updatedAt).getTime() -
      new Date(firstBoard.updatedAt).getTime(),
  )
  const workspace = workspacesQuery.data?.data.workspaces[0]
  const workspaceName =
    workspace?.name ?? boards[0]?.workspaceName ?? 'Workspace'

  return (
    <WorkspaceShell
      activeItem="recent"
      boards={boards}
      workspaceName={workspaceName}
    >
      <div className="rounded-2xl border bg-background p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock aria-hidden="true" className="size-4" />
              <span>{workspaceName}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Recent
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Boards sorted by the latest update.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {recentBoards.length}{' '}
              {recentBoards.length === 1 ? 'board' : 'boards'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void boardsQuery.refetch()}
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {boardsQuery.isLoading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="h-52">
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
      ) : boardsQuery.isError ? (
        <Card className="mt-4 border-destructive/40">
          <CardHeader>
            <CardTitle>Unable to load recent boards</CardTitle>
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
      ) : recentBoards.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recentBoards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <Card className="mt-4 border-dashed bg-background/70">
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Clock aria-hidden="true" className="size-4" />
            </div>
            <div>
              <p className="font-medium">No recent boards</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a board to start building your activity history.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  )
}
