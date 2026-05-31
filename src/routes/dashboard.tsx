import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard, Plus, RefreshCw, Star, Users } from 'lucide-react'

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
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'
import { WorkspaceShell } from '@/features/workspaces/components/workspace-shell'
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
      <div className="rounded-2xl border bg-background p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutDashboard aria-hidden="true" className="size-4" />
              <span className="truncate">{workspaceName}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Boards
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pick up recent work, manage favorites, or create a new visual
              board for the next project.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void boardsQuery.refetch()}
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
            <CreateBoardDialog workspaceId={activeWorkspaceId ?? undefined}>
              <Button className="shadow-sm">
                <Plus data-icon="inline-start" />
                New board
              </Button>
            </CreateBoardDialog>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <DashboardMetric
            label="Total boards"
            value={workspaceBoards.length}
            icon={LayoutDashboard}
          />
          <DashboardMetric
            label="Favorites"
            value={favoriteBoards.length}
            icon={Star}
          />
          <DashboardMetric
            label="Workspace"
            value={workspaceName}
            icon={Users}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Workspace boards
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Favorites stay pinned separately so the main board list stays
              clean.
            </p>
          </div>
          <Badge variant="secondary">
            {workspaceBoards.length}{' '}
            {workspaceBoards.length === 1 ? 'board' : 'boards'}
          </Badge>
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
        <div className="mt-4 flex flex-col gap-6">
          {favoriteBoards.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Star
                  aria-hidden="true"
                  className="size-4 fill-current text-primary"
                />
                <h2 className="text-lg font-semibold">Favorites</h2>
                <Badge variant="secondary">{favoriteBoards.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {favoriteBoards.map((board) => (
                  <BoardCard key={board.id} board={board} featured />
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {standardBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}

            <Card className="border-dashed bg-background/60">
              <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Plus aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <p className="font-medium">
                    {workspaceBoards.length === 0
                      ? 'Create your first board'
                      : 'Create a board'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with lists, cards, labels, and teammates.
                  </p>
                </div>
                <CreateBoardDialog workspaceId={activeWorkspaceId ?? undefined}>
                  <Button variant="outline" size="sm">
                    New board
                  </Button>
                </CreateBoardDialog>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </WorkspaceShell>
  )
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LayoutDashboard
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
