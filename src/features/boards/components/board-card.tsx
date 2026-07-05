import { Link } from '@tanstack/react-router'
import { Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToggleBoardStarMutation } from '@/features/boards/hooks/use-boards'
import type { Board } from '@/features/boards/types'
import { getBoardAccentClass } from '@/lib/board-colors'
import { cn } from '@/lib/utils'

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
  const accentClass = getBoardAccentClass(board.id)
  const updatedLabel = new Date(board.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

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
    <article
      className={cn(
        'flex h-full min-w-0 flex-col overflow-hidden rounded-[10px] border bg-card',
        featured ? 'border-primary/35' : 'border-border/80',
      )}
    >
      <div className={cn('h-1 shrink-0', accentClass)} aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/boards/$boardId"
            params={{ boardId: board.id }}
            className="min-w-0 flex-1"
          >
            <h3 className="truncate text-sm font-semibold">{board.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {board.description || 'No description yet.'}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            {board.isStarred ? (
              <span
                aria-hidden="true"
                className="mt-1 size-2 rounded-sm bg-flow-yellow"
              />
            ) : null}
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
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {board.visibility}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {updatedLabel}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-3">
          <BoardActions board={board} />
        </div>
      </div>
    </article>
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
