import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  Clock,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import { CreateBoardDialog } from '@/features/boards/components/create-board-dialog'
import { DeleteBoardDialog } from '@/features/boards/components/delete-board-dialog'
import { EditBoardDialog } from '@/features/boards/components/edit-board-dialog'
import {
  useBoardsQuery,
  useToggleBoardStarMutation,
} from '@/features/boards/hooks/use-boards'
import type { Board } from '@/features/boards/types'
import { useWorkspacesQuery } from '@/features/workspaces/hooks/use-workspaces'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    try {
      const response = await getCurrentUser()

      if (!response.data.user) {
        throw redirect({ to: '/login' })
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error
      }

      throw redirect({ to: '/login' })
    }
  },
  component: DashboardPage,
})

const workspaceLinks = [
  { label: 'Boards', icon: LayoutDashboard, active: true },
  { label: 'Favorites', icon: Star, active: false },
  { label: 'Members', icon: Users, active: false },
  { label: 'Recent', icon: Clock, active: false },
]

function DashboardPage() {
  const boardsQuery = useBoardsQuery()
  const workspacesQuery = useWorkspacesQuery()
  const boards = boardsQuery.data?.data.boards ?? []
  const favoriteBoards = boards.filter((board) => board.isStarred)
  const standardBoards =
    favoriteBoards.length > 0
      ? boards.filter((board) => !board.isStarred)
      : boards
  const workspace = workspacesQuery.data?.data.workspaces[0]
  const workspaceName =
    workspace?.name ?? boards[0]?.workspaceName ?? 'Workspace'

  return (
    <div className="grid h-full gap-0 overflow-hidden md:grid-cols-[17rem_1fr]">
      <aside className="hidden overflow-y-auto border-r bg-background px-4 py-5 md:block">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
          <Avatar className="size-10 rounded-lg">
            <AvatarFallback className="rounded-lg">
              {workspaceName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{workspaceName}</p>
            <p className="text-xs text-muted-foreground">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
            </p>
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-1">
          {workspaceLinks.map((item) => (
            <a
              key={item.label}
              className={
                item.active
                  ? 'flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground'
                  : 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground'
              }
              href="/dashboard"
            >
              <item.icon aria-hidden="true" className="size-4" />
              {item.label}
            </a>
          ))}
        </nav>

        <Separator className="my-5" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Favorites
            </p>
            <Badge variant="secondary">{favoriteBoards.length}</Badge>
          </div>
          {favoriteBoards.length > 0 ? (
            <div className="flex flex-col gap-1">
              {favoriteBoards.slice(0, 5).map((board) => (
                <Link
                  key={board.id}
                  to="/boards/$boardId"
                  params={{ boardId: board.id }}
                  className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Star aria-hidden="true" className="size-4 fill-current" />
                  <span className="truncate">{board.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Star boards to keep your most important work close.
            </p>
          )}
        </div>
      </aside>

      <section className="min-w-0 overflow-y-auto bg-muted/30 px-4 py-5 md:px-8 md:py-7">
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
              <CreateBoardDialog>
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
              value={boards.length}
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
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
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
                    <DashboardBoardCard key={board.id} board={board} featured />
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {standardBoards.map((board) => (
                <DashboardBoardCard key={board.id} board={board} />
              ))}

              <Card className="border-dashed bg-background/60">
                <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Plus aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {boards.length === 0
                        ? 'Create your first board'
                        : 'Create a board'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start with lists, cards, labels, and teammates.
                    </p>
                  </div>
                  <CreateBoardDialog>
                    <Button variant="outline" size="sm">
                      New board
                    </Button>
                  </CreateBoardDialog>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </section>
    </div>
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

function DashboardBoardCard({
  board,
  featured = false,
}: {
  board: Board
  featured?: boolean
}) {
  const toggleStarMutation = useToggleBoardStarMutation(board.id)

  async function handleToggleStar() {
    try {
      await toggleStarMutation.mutateAsync({ isStarred: !board.isStarred })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update star.',
      )
    }
  }

  return (
    <Card
      className={
        featured
          ? 'h-full bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
          : 'h-full bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
      }
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/boards/$boardId"
            params={{ boardId: board.id }}
            className="min-w-0 flex-1"
          >
            <CardTitle className="truncate text-base">{board.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {board.description || 'No description yet.'}
            </CardDescription>
          </Link>
          <Button
            variant={board.isStarred ? 'secondary' : 'ghost'}
            className={board.isStarred ? 'text-primary' : undefined}
            size="icon-sm"
            aria-label={
              board.isStarred ? `Unstar ${board.name}` : `Star ${board.name}`
            }
            onClick={() => void handleToggleStar()}
            disabled={toggleStarMutation.isPending}
          >
            <Star
              aria-hidden="true"
              className={board.isStarred ? 'fill-current' : undefined}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{board.workspaceName}</Badge>
          <Badge variant="outline">{board.visibility}</Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
            <Star aria-hidden="true" className="size-4" />
            <span className="truncate">
              {board.isStarred
                ? 'Favorite'
                : `Updated ${new Date(board.updatedAt).toLocaleDateString()}`}
            </span>
          </div>
          <DropdownBoardActions board={board} />
        </div>
      </CardContent>
    </Card>
  )
}

function DropdownBoardActions({ board }: { board: Board }) {
  return (
    <div className="flex items-center gap-1">
      <EditBoardDialog board={board}>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Edit ${board.name}`}
        >
          <Pencil aria-hidden="true" />
        </Button>
      </EditBoardDialog>
      <DeleteBoardDialog board={board}>
        <Button
          variant="destructive"
          size="icon-sm"
          aria-label={`Delete ${board.name}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </DeleteBoardDialog>
    </div>
  )
}
