import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Edit3,
  Layers,
  MoreHorizontal,
  Palette,
  PanelTop,
  Plus,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { CardShell } from '@/features/boards/components/board-card-shell'
import {
  useCreateCardMutation,
  useCreateListMutation,
  useDeleteCardMutation,
  useDeleteListMutation,
  useUpdateListMutation,
} from '@/features/boards/hooks/use-boards'
import {
  cardColors,
  listColors,
  listIcons,
} from '@/features/boards/lib/board-style'
import type {
  CardColor,
  ListColor,
  ListIcon,
} from '@/features/boards/lib/board-style'
import type { BoardCard, BoardListWithCards } from '@/features/boards/types'

import { BoardMenuStat } from './board-menu-stat'

export function BoardListSection({
  boardId,
  cardColorById,
  compactCards,
  color,
  icon,
  isCollapsed,
  isFiltering,
  isMovingList,
  list,
  listCount,
  listIndex,
  onMoveList,
  onSetCardColor,
  onSetListColor,
  onSetListIcon,
  onToggleCollapsed,
}: {
  boardId: string
  cardColorById: Record<string, CardColor>
  compactCards: boolean
  color: ListColor
  icon: ListIcon
  isCollapsed: boolean
  isFiltering: boolean
  isMovingList: boolean
  list: BoardListWithCards
  listCount: number
  listIndex: number
  onMoveList: (listId: string, toIndex: number) => Promise<void> | void
  onSetCardColor: (cardId: string, color: CardColor) => void
  onSetListColor: (listId: string, color: ListColor) => void
  onSetListIcon: (listId: string, icon: ListIcon) => void
  onToggleCollapsed: () => void
}) {
  const Icon = icon.icon
  const createCardMutation = useCreateCardMutation(boardId)
  const createListMutation = useCreateListMutation(boardId)
  const deleteCardMutation = useDeleteCardMutation(boardId)
  const deleteListMutation = useDeleteListMutation(boardId)
  const updateListMutation = useUpdateListMutation(boardId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: 'list',
      listId: list.id,
    },
  })
  const cardIds = useMemo(() => list.cards.map((card) => card.id), [list.cards])
  const completedCards = list.cards.filter((card) => card.completed)

  async function handleCopyListTitle() {
    try {
      await navigator.clipboard.writeText(list.name)
      toast.success('List title copied.')
    } catch {
      toast.error('Unable to copy list title.')
    }
  }

  async function handleDuplicateList() {
    try {
      const response = await createListMutation.mutateAsync({
        boardId,
        name: `${list.name} copy`,
      })

      for (const card of list.cards) {
        await createCardMutation.mutateAsync({
          listId: response.data.list.id,
          title: card.title,
          description: card.description ?? undefined,
        })
      }

      toast.success('List duplicated.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to duplicate list.',
      )
    }
  }

  async function handleClearCompletedCards() {
    try {
      await Promise.all(
        completedCards.map((card) => deleteCardMutation.mutateAsync(card.id)),
      )
      toast.success('Completed cards cleared.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to clear completed cards.',
      )
    }
  }

  return (
    <section
      ref={setNodeRef}
      className={
        isOver
          ? 'flex max-h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-2xl shadow-foreground/15 ring-2 ring-white/80 backdrop-blur-2xl dark:bg-background/60'
          : 'flex max-h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/45 bg-white/55 shadow-xl shadow-foreground/10 backdrop-blur-2xl transition-all hover:bg-white/65 dark:bg-background/55'
      }
    >
      <div className={`h-2 ${color.bar}`} />
      <div className="flex items-center justify-between gap-3 border-b border-white/45 bg-white/40 px-3 py-3 backdrop-blur-xl dark:bg-background/40">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex size-6 items-center justify-center rounded-md ${color.icon}`}
          >
            <Icon aria-hidden="true" className="size-3.5" />
          </span>
          <h2 className="truncate text-sm font-semibold">{list.name}</h2>
          <Badge variant="outline">{list.cards.length}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${list.name} menu`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="block truncate text-sm text-foreground">
                {list.name}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {list.cards.length} {list.cards.length === 1 ? 'card' : 'cards'}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setRenameOpen(true)
                }}
              >
                <Edit3 aria-hidden="true" />
                Rename list
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleCollapsed}>
                {isCollapsed ? (
                  <ChevronsUpDown aria-hidden="true" />
                ) : (
                  <ChevronsDownUp aria-hidden="true" />
                )}
                {isCollapsed ? 'Expand list' : 'Collapse list'}
                {isCollapsed && (
                  <Check aria-hidden="true" className="ml-auto" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleCopyListTitle()}>
                <Copy aria-hidden="true" />
                Copy list title
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => void handleDuplicateList()}
                disabled={
                  createListMutation.isPending || createCardMutation.isPending
                }
              >
                <Layers aria-hidden="true" />
                Duplicate list
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => void handleClearCompletedCards()}
                disabled={
                  completedCards.length === 0 || deleteCardMutation.isPending
                }
              >
                <CheckCircle2 aria-hidden="true" />
                Clear completed cards
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={listIndex === 0 || isMovingList}
                onSelect={() => void onMoveList(list.id, listIndex - 1)}
              >
                <ArrowLeft aria-hidden="true" />
                Move left
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={listIndex >= listCount - 1 || isMovingList}
                onSelect={() => void onMoveList(list.id, listIndex + 1)}
              >
                <ArrowRight aria-hidden="true" />
                Move right
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIconOpen(true)}>
              <PanelTop aria-hidden="true" />
              Choose icon
              <span className="ml-auto text-xs text-muted-foreground">
                {icon.name}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Palette aria-hidden="true" className="size-4" />
              List color
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {listColors.map((listColor) => (
                <DropdownMenuItem
                  key={listColor.name}
                  onSelect={() => onSetListColor(list.id, listColor)}
                >
                  <span
                    className={`size-3 rounded-full shadow-sm ring-1 ring-black/10 ${listColor.swatch}`}
                    aria-hidden="true"
                  />
                  {listColor.name}
                  {color.name === listColor.name && (
                    <Check aria-hidden="true" className="ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-2 gap-2 p-1">
              <BoardMenuStat label="Cards" value={list.cards.length} />
              <BoardMenuStat label="Done" value={completedCards.length} />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault()
                setDeleteOpen(true)
              }}
            >
              <Trash2 aria-hidden="true" />
              Delete list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <RenameListDialog
          list={list}
          open={renameOpen}
          onOpenChange={setRenameOpen}
          updateListMutation={updateListMutation}
        />
        <ListIconDialog
          color={color}
          icon={icon}
          list={list}
          open={iconOpen}
          onOpenChange={setIconOpen}
          onSetIcon={onSetListIcon}
        />
        <DeleteListDialog
          deleteListMutation={deleteListMutation}
          list={list}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        {!isCollapsed && (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-white/20 p-2 backdrop-blur-xl dark:bg-background/20">
            {list.cards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/55 bg-white/45 p-3 text-sm text-muted-foreground backdrop-blur-xl dark:bg-background/45">
                {isFiltering ? 'No matching cards.' : 'Drop a card here.'}
              </div>
            ) : (
              list.cards.map((card, index) => (
                <SortableCard
                  key={card.id}
                  boardId={boardId}
                  card={card}
                  color={
                    cardColorById[card.id] ??
                    cardColors[index % cardColors.length]
                  }
                  compact={compactCards}
                  onSetCardColor={onSetCardColor}
                />
              ))
            )}
            <AddCardForm boardId={boardId} list={list} />
          </div>
        )}
      </SortableContext>
    </section>
  )
}

function ListIconDialog({
  color,
  icon,
  list,
  open,
  onOpenChange,
  onSetIcon,
}: {
  color: ListColor
  icon: ListIcon
  list: BoardListWithCards
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetIcon: (listId: string, icon: ListIcon) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose list icon</DialogTitle>
          <DialogDescription>
            Pick a lucide icon for "{list.name}". This is a local board style.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {listIcons.map((listIcon) => {
            const OptionIcon = listIcon.icon
            const isSelected = icon.name === listIcon.name

            return (
              <Button
                key={listIcon.name}
                type="button"
                variant={isSelected ? 'secondary' : 'outline'}
                className={
                  isSelected
                    ? 'relative h-20 flex-col gap-2 border-primary/30 bg-primary/10 text-primary'
                    : 'relative h-20 flex-col gap-2 bg-background/80'
                }
                onClick={() => {
                  onSetIcon(list.id, listIcon)
                  onOpenChange(false)
                }}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-lg ${color.icon}`}
                >
                  <OptionIcon aria-hidden="true" className="size-4" />
                </span>
                <span className="text-xs">{listIcon.name}</span>
                {isSelected && (
                  <Check
                    aria-hidden="true"
                    className="absolute right-2 top-2"
                  />
                )}
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortableCard({
  boardId,
  card,
  compact,
  color,
  onSetCardColor,
}: {
  boardId: string
  card: BoardCard
  compact: boolean
  color: CardColor
  onSetCardColor: (cardId: string, color: CardColor) => void
}) {
  const [isCardInteractionOpen, setIsCardInteractionOpen] = useState(false)
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      cardId: card.id,
      listId: card.listId,
    },
    disabled: isCardInteractionOpen,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={
        isDragging
          ? 'cursor-grabbing rounded-xl bg-white/75 p-3 text-card-foreground opacity-60 shadow-lg ring-2 ring-white/80 backdrop-blur-xl dark:bg-background/75'
          : 'cursor-grab rounded-xl bg-white/70 p-3 text-card-foreground shadow-md shadow-foreground/5 ring-1 ring-white/70 backdrop-blur-xl transition-all hover:-translate-y-px hover:bg-white/85 hover:shadow-lg dark:bg-background/70'
      }
    >
      <CardShell
        boardId={boardId}
        card={card}
        compact={compact}
        color={color}
        onInteractionOpenChange={setIsCardInteractionOpen}
        onSetCardColor={onSetCardColor}
      />
    </article>
  )
}

function RenameListDialog({
  list,
  open,
  onOpenChange,
  updateListMutation,
}: {
  list: BoardListWithCards
  open: boolean
  onOpenChange: (open: boolean) => void
  updateListMutation: ReturnType<typeof useUpdateListMutation>
}) {
  const [name, setName] = useState(list.name)
  const [nameError, setNameError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setNameError('List name is required.')
      return
    }

    setNameError(null)

    try {
      await updateListMutation.mutateAsync({
        listId: list.id,
        input: {
          name: name.trim(),
        },
      })
      toast.success('List renamed.')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to rename list.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownCapture={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Rename list</DialogTitle>
          <DialogDescription>Update this list title.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor={`list-name-${list.id}`}
            >
              Name
            </label>
            <Input
              id={`list-name-${list.id}`}
              value={name}
              aria-invalid={Boolean(nameError)}
              onChange={(event) => setName(event.target.value)}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateListMutation.isPending}>
              {updateListMutation.isPending ? 'Saving...' : 'Save list'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteListDialog({
  deleteListMutation,
  list,
  open,
  onOpenChange,
}: {
  deleteListMutation: ReturnType<typeof useDeleteListMutation>
  list: BoardListWithCards
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  async function handleDelete() {
    try {
      await deleteListMutation.mutateAsync(list.id)
      toast.success('List deleted.')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete list.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete list</DialogTitle>
          <DialogDescription>
            Delete "{list.name}" and all {list.cards.length}{' '}
            {list.cards.length === 1 ? 'card' : 'cards'} inside it. This cannot
            be undone.
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
            disabled={deleteListMutation.isPending}
          >
            {deleteListMutation.isPending ? 'Deleting...' : 'Delete list'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddListForm({ boardId }: { boardId: string }) {
  const createListMutation = useCreateListMutation(boardId)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      return
    }

    try {
      await createListMutation.mutateAsync({ boardId, name: name.trim() })
      setName('')
      setIsAdding(false)
      toast.success('List added.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add list.',
      )
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className="h-12 w-full justify-start rounded-2xl border-white/60 bg-white/55 shadow-xl shadow-foreground/10 backdrop-blur-2xl hover:bg-white/75 dark:bg-background/55"
        onClick={() => setIsAdding(true)}
      >
        <Plus data-icon="inline-start" />
        Add another list
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/65 p-2 shadow-xl shadow-foreground/10 backdrop-blur-2xl dark:bg-background/65"
    >
      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="List name"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={createListMutation.isPending}>
          {createListMutation.isPending ? 'Adding...' : 'Add list'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function AddCardForm({
  boardId,
  list,
}: {
  boardId: string
  list: BoardListWithCards
}) {
  const createCardMutation = useCreateCardMutation(boardId)
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    try {
      await createCardMutation.mutateAsync({
        listId: list.id,
        title: title.trim(),
      })
      setTitle('')
      setIsAdding(false)
      toast.success('Card added.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add card.',
      )
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        className="justify-start rounded-xl bg-white/45 text-muted-foreground ring-1 ring-white/55 backdrop-blur-xl hover:bg-white/70 hover:text-foreground dark:bg-background/45"
        onClick={() => setIsAdding(true)}
      >
        <Plus data-icon="inline-start" />
        Add card
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border border-white/55 bg-white/70 p-2 shadow-md shadow-foreground/5 backdrop-blur-xl dark:bg-background/70"
    >
      <Input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Card title"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={createCardMutation.isPending}>
          {createCardMutation.isPending ? 'Adding...' : 'Add card'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
