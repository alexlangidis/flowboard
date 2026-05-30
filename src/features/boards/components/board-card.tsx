import { Link } from '@tanstack/react-router'
import { Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToggleBoardStarMutation } from '@/features/boards/hooks/use-boards'
import type { Board } from '@/features/boards/types'

import { DeleteBoardDialog } from './delete-board-dialog'
import { EditBoardDialog } from './edit-board-dialog'

export function BoardCard({
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
          ? 'h-full bg-background shadow-sm ring-1 ring-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md'
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
          <BoardActions board={board} />
        </div>
      </CardContent>
    </Card>
  )
}

function BoardActions({ board }: { board: Board }) {
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
