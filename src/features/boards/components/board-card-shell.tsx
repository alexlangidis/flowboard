import {
  AlignLeft,
  Copy,
  Edit3,
  GripVertical,
  Layers,
  MoreHorizontal,
  Palette,
  PanelTop,
  Square,
  SquareCheckBig,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  useCreateCardMutation,
  useDeleteCardMutation,
  useMoveCardMutation,
  useUpdateCardMutation,
} from '@/features/boards/hooks/use-boards'
import { CardDetailDialog } from '@/features/boards/components/card-detail-dialog'
import { cardColors } from '@/features/boards/lib/board-style'
import type { CardColor } from '@/features/boards/lib/board-style'
import type { BoardCard } from '@/features/boards/types'

export function CardShell({
  boardId,
  card,
  className,
  compact = false,
  color = cardColors[0],
  onInteractionOpenChange,
  onSetCardColor,
}: {
  boardId?: string
  card: BoardCard
  className?: string
  compact?: boolean
  color?: CardColor
  onInteractionOpenChange?: (open: boolean) => void
  onSetCardColor?: (cardId: string, color: CardColor) => void
}) {
  const updateCardMutation = useUpdateCardMutation(boardId ?? '')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  function handleDetailsOpenChange(open: boolean) {
    setDetailsOpen(open)
    onInteractionOpenChange?.(open || editOpen)
  }

  function handleEditOpenChange(open: boolean) {
    setEditOpen(open)
    onInteractionOpenChange?.(open || detailsOpen)
  }

  async function handleToggleCompleted() {
    if (!boardId) {
      return
    }

    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          completed: !card.completed,
        },
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update card.',
      )
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={
          className
            ? `group/card-button w-full rounded-xl bg-white/75 p-3 text-left text-card-foreground ring-1 ring-white/70 backdrop-blur-xl transition-all hover:bg-white/90 hover:ring-white focus-visible:ring-2 focus-visible:ring-primary dark:bg-background/75 ${className}`
            : 'group/card-button w-full rounded-xl bg-white/75 p-3 text-left text-card-foreground ring-1 ring-white/70 backdrop-blur-xl transition-all hover:bg-white/90 hover:ring-white focus-visible:ring-2 focus-visible:ring-primary dark:bg-background/75'
        }
        onClick={() => handleDetailsOpenChange(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleDetailsOpenChange(true)
          }
        }}
      >
        <div className="mb-3 flex items-center gap-1.5">
          <span className={`h-1.5 w-10 rounded-full ${color.bar}`} />
          {card.description && (
            <span className={`h-1.5 w-6 rounded-full ${color.mutedBar}`} />
          )}
        </div>
        <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2">
          {boardId ? (
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={
                card.completed
                  ? `Mark ${card.title} incomplete`
                  : `Mark ${card.title} complete`
              }
              role="button"
              tabIndex={0}
              title={card.completed ? 'Mark incomplete' : 'Mark complete'}
              onClick={(event) => {
                event.stopPropagation()
                void handleToggleCompleted()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  void handleToggleCompleted()
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {card.completed ? (
                <SquareCheckBig
                  aria-hidden="true"
                  className="size-4 text-green-600"
                />
              ) : (
                <Square aria-hidden="true" className="size-4" />
              )}
            </span>
          ) : (
            <GripVertical
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          )}
          <h3
            className={
              card.completed
                ? 'min-w-0 break-words text-sm leading-snug font-medium text-muted-foreground line-through [overflow-wrap:anywhere]'
                : 'min-w-0 break-words text-sm leading-snug font-medium [overflow-wrap:anywhere]'
            }
          >
            {card.title}
          </h3>
          {boardId && onSetCardColor && (
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover/card-button:opacity-100 md:group-focus-visible/card-button:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Quick edit ${card.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  handleEditOpenChange(true)
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Edit3 aria-hidden="true" />
              </Button>
              <CardSettingsMenu
                boardId={boardId}
                card={card}
                onInteractionOpenChange={onInteractionOpenChange}
                onEditCard={() => handleEditOpenChange(true)}
                onOpenCard={() => handleDetailsOpenChange(true)}
                onSetCardColor={onSetCardColor}
              />
            </div>
          )}
        </div>
        {!compact && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              {card.completed && (
                <span className="flex items-center gap-1.5">
                  <SquareCheckBig aria-hidden="true" className="size-3.5" />
                  Complete
                </span>
              )}
              {card.description && (
                <span className="flex items-center gap-1.5">
                  <AlignLeft aria-hidden="true" className="size-3.5" />
                  Description
                </span>
              )}
            </div>
            <Badge
              variant="outline"
              className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300"
            >
              Card
            </Badge>
          </div>
        )}
      </div>
      {boardId && onSetCardColor && (
        <EditCardDialog
          card={card}
          open={editOpen}
          onOpenChange={handleEditOpenChange}
          color={color}
          onSetCardColor={onSetCardColor}
          updateCardMutation={updateCardMutation}
        />
      )}
      <CardDetailDialog
        boardId={boardId}
        card={card}
        color={color}
        open={detailsOpen}
        onOpenChange={handleDetailsOpenChange}
      />
    </>
  )
}

function CardSettingsMenu({
  boardId,
  card,
  onInteractionOpenChange,
  onEditCard,
  onOpenCard,
  onSetCardColor,
}: {
  boardId: string
  card: BoardCard
  onInteractionOpenChange?: (open: boolean) => void
  onEditCard: () => void
  onOpenCard: () => void
  onSetCardColor: (cardId: string, color: CardColor) => void
}) {
  const createCardMutation = useCreateCardMutation(boardId)
  const deleteCardMutation = useDeleteCardMutation(boardId)
  const moveCardMutation = useMoveCardMutation(boardId)
  const updateCardMutation = useUpdateCardMutation(boardId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function handleMenuOpenChange(open: boolean) {
    setMenuOpen(open)
    onInteractionOpenChange?.(open || deleteOpen)
  }

  function handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open)
    onInteractionOpenChange?.(open || menuOpen)
  }

  async function handleCopy(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    } catch {
      toast.error('Unable to copy to clipboard.')
    }
  }

  async function handleDuplicate() {
    try {
      await createCardMutation.mutateAsync({
        listId: card.listId,
        title: `${card.title} copy`,
        description: card.description ?? undefined,
      })
      toast.success('Card duplicated.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to duplicate card.',
      )
    }
  }

  async function handleToggleCompleted() {
    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          completed: !card.completed,
        },
      })
      toast.success(card.completed ? 'Card reopened.' : 'Card completed.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update card.',
      )
    }
  }

  async function handleMoveToTop() {
    try {
      await moveCardMutation.mutateAsync({
        cardId: card.id,
        toListId: card.listId,
        toIndex: 0,
      })
      toast.success('Card moved to top.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to move card.',
      )
    }
  }

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Card settings"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          onPointerDownCapture={(event) => event.stopPropagation()}
        >
          <DropdownMenuLabel>Card settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={onOpenCard}>
              <PanelTop aria-hidden="true" />
              Open card
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEditCard}>
              <Edit3 aria-hidden="true" />
              Edit card
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void handleCopy(card.title, 'Card title copied.')}
            >
              <Copy aria-hidden="true" />
              Copy title
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                void handleCopy(
                  [card.title, card.description ?? '']
                    .filter(Boolean)
                    .join('\n\n'),
                  'Card details copied.',
                )
              }
            >
              <Copy aria-hidden="true" />
              Copy details
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => void handleDuplicate()}
              disabled={createCardMutation.isPending}
            >
              <Layers aria-hidden="true" />
              Duplicate card
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void handleMoveToTop()}
              disabled={moveCardMutation.isPending}
            >
              <PanelTop aria-hidden="true" />
              Move to top
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void handleToggleCompleted()}
              disabled={updateCardMutation.isPending}
            >
              {card.completed ? (
                <Square aria-hidden="true" />
              ) : (
                <SquareCheckBig aria-hidden="true" />
              )}
              {card.completed ? 'Mark incomplete' : 'Mark complete'}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <Palette aria-hidden="true" className="size-4" />
            Label color
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {cardColors.map((cardColor, index) => (
              <DropdownMenuItem
                key={cardColor.bar}
                onSelect={() => onSetCardColor(card.id, cardColor)}
              >
                <span
                  className={`h-2 w-10 rounded-full ${cardColor.bar}`}
                  aria-hidden="true"
                />
                Label {index + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault()
              handleDeleteOpenChange(true)
            }}
          >
            <Trash2 aria-hidden="true" />
            Delete card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteCardDialog
        card={card}
        deleteCardMutation={deleteCardMutation}
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
      />
    </div>
  )
}

function EditCardDialog({
  card,
  color,
  open,
  onOpenChange,
  onSetCardColor,
  updateCardMutation,
}: {
  card: BoardCard
  color: CardColor
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetCardColor: (cardId: string, color: CardColor) => void
  updateCardMutation: ReturnType<typeof useUpdateCardMutation>
}) {
  const [title, setTitle] = useState(card.title)
  const [titleError, setTitleError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      setTitleError('Card title is required.')
      return
    }

    setTitleError(null)

    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          title: title.trim(),
        },
      })
      toast.success('Card updated.')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update card.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md overflow-hidden"
        onPointerDownCapture={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
          <DialogDescription>
            Update this card title and style.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor={`card-title-${card.id}`}
            >
              Title
            </label>
            <Input
              id={`card-title-${card.id}`}
              className="w-full min-w-0"
              value={title}
              aria-invalid={Boolean(titleError)}
              onChange={(event) => setTitle(event.target.value)}
            />
            {titleError && (
              <p className="text-sm text-destructive">{titleError}</p>
            )}
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Label color</span>
              <span className="text-xs text-muted-foreground">
                {color.name}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {cardColors.map((cardColor) => (
                <button
                  key={cardColor.name}
                  type="button"
                  className={
                    color.name === cardColor.name
                      ? 'flex h-9 items-center justify-center rounded-lg border-2 border-foreground bg-background p-1'
                      : 'flex h-9 items-center justify-center rounded-lg border bg-background p-1 hover:bg-muted'
                  }
                  aria-label={`Use ${cardColor.name} label`}
                  onClick={() => onSetCardColor(card.id, cardColor)}
                >
                  <span
                    className={`h-2 w-full rounded-full ${cardColor.swatch}`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateCardMutation.isPending}>
              {updateCardMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteCardDialog({
  card,
  deleteCardMutation,
  open,
  onOpenChange,
}: {
  card: BoardCard
  deleteCardMutation: ReturnType<typeof useDeleteCardMutation>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  async function handleDelete() {
    try {
      await deleteCardMutation.mutateAsync(card.id)
      toast.success('Card deleted.')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete card.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownCapture={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Delete card</DialogTitle>
          <DialogDescription>
            Delete "{card.title}" from this board. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleteCardMutation.isPending}
          >
            {deleteCardMutation.isPending ? 'Deleting...' : 'Delete card'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
