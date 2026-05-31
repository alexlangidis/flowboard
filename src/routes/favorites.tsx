import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw, Star } from 'lucide-react'

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
import { useActiveWorkspace } from '@/features/workspaces/hooks/use-active-workspace'

export const Route = createFileRoute('/favorites')({
  beforeLoad: requireAuthenticatedUser,
  component: FavoritesPage,
})

function FavoritesPage() {
  const boardsQuery = useBoardsQuery()
  const boards = boardsQuery.data?.data.boards ?? []
  const { workspaceBoards, workspaceName } = useActiveWorkspace(boards)
  const favoriteBoards = workspaceBoards.filter((board) => board.isStarred)

  return (
    <WorkspaceShell
      activeItem="favorites"
      boards={workspaceBoards}
      workspaceName={workspaceName}
    >
      <div className="rounded-2xl border bg-background p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star aria-hidden="true" className="size-4" />
              <span>{workspaceName}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Favorites
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Starred boards stay here for quick access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {favoriteBoards.length}{' '}
              {favoriteBoards.length === 1 ? 'favorite' : 'favorites'}
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
            <CardTitle>Unable to load favorites</CardTitle>
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
      ) : favoriteBoards.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favoriteBoards.map((board) => (
            <BoardCard key={board.id} board={board} featured />
          ))}
        </div>
      ) : (
        <Card className="mt-4 border-dashed bg-background/70">
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Star aria-hidden="true" className="size-4" />
            </div>
            <div>
              <p className="font-medium">No favorites yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Star a board from the dashboard to pin it here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  )
}
