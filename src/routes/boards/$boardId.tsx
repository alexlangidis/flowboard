import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  CircleDot,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import { DeleteBoardDialog } from '@/features/boards/components/delete-board-dialog'
import { EditBoardDialog } from '@/features/boards/components/edit-board-dialog'
import {
  useBoardQuery,
  useCreateCardMutation,
  useCreateListMutation,
  useMoveCardMutation,
  useToggleBoardStarMutation,
} from '@/features/boards/hooks/use-boards'
import type {
  Board,
  BoardCard,
  BoardDetail,
  BoardListWithCards,
} from '@/features/boards/types'

export const Route = createFileRoute('/boards/$boardId')({
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
  component: BoardPage,
})

function BoardPage() {
  const { boardId } = Route.useParams()
  const boardQuery = useBoardQuery(boardId)
  const board = boardQuery.data?.data.board
  const toggleStarMutation = useToggleBoardStarMutation(boardId)
  const moveCardMutation = useMoveCardMutation(boardId)
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null)
  const localBoard = board ?? null
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  async function handleToggleStar(board: Board) {
    try {
      await toggleStarMutation.mutateAsync({ isStarred: !board.isStarred })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update star.',
      )
    }
  }

  async function handleDragStart(event: DragStartEvent) {
    if (!localBoard) {
      return
    }

    const card = findCard(localBoard, String(event.active.id))

    setActiveCard(card ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)

    if (!localBoard || !event.over) {
      return
    }

    const cardId = String(event.active.id)
    const target = getDropTarget(localBoard, String(event.over.id))

    if (!target) {
      return
    }

    const currentCard = findCard(localBoard, cardId)

    if (
      currentCard?.listId === target.toListId &&
      currentCard.position === target.toIndex
    ) {
      return
    }

    try {
      await moveCardMutation.mutateAsync({
        cardId,
        toListId: target.toListId,
        toIndex: target.toIndex,
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to move card.',
      )
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/40">
      <div className="border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">
                Boards
              </Link>
              <span>/</span>
              <span>{board?.workspaceName ?? 'Workspace'}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {board?.name ?? 'Loading board'}
              </h1>
              <Button
                variant={board?.isStarred ? 'secondary' : 'ghost'}
                className={board?.isStarred ? 'text-primary' : undefined}
                size="icon-sm"
                aria-label={board?.isStarred ? 'Unstar board' : 'Star board'}
                disabled={!board || toggleStarMutation.isPending}
                onClick={() => {
                  if (board) {
                    void handleToggleStar(board)
                  }
                }}
              >
                <Star
                  aria-hidden="true"
                  className={board?.isStarred ? 'fill-current' : undefined}
                />
              </Button>
              {board && (
                <>
                  <Badge variant="secondary">{board.visibility}</Badge>
                  <Badge variant="outline">
                    {board.lists.length}{' '}
                    {board.lists.length === 1 ? 'list' : 'lists'}
                  </Badge>
                </>
              )}
            </div>
            {board?.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {board.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <Users data-icon="inline-start" />
              Share
            </Button>
            {board && (
              <>
                <EditBoardDialog board={board}>
                  <Button variant="outline" size="sm">
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                </EditBoardDialog>
                <DeleteBoardDialog board={board} navigateToDashboard>
                  <Button variant="destructive" size="sm">
                    <Trash2 data-icon="inline-start" />
                    Delete
                  </Button>
                </DeleteBoardDialog>
              </>
            )}
          </div>
        </div>
      </div>

      {boardQuery.isLoading ? (
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 md:p-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-background p-3 shadow-sm ring-1 ring-border"
            >
              <div className="h-5 w-32 rounded bg-background/80" />
              <Separator className="my-3" />
              <div className="flex flex-col gap-2">
                <div className="h-24 rounded-lg bg-background/80" />
                <div className="h-16 rounded-lg bg-background/80" />
              </div>
            </section>
          ))}
        </div>
      ) : boardQuery.isError || !localBoard ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Unable to load board</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This board may not exist, or you may not have access to it.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
              <Button onClick={() => void boardQuery.refetch()}>
                <RefreshCw data-icon="inline-start" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => void handleDragStart(event)}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 md:p-5">
            {localBoard.lists.map((list) => (
              <BoardListSection
                key={list.id}
                boardId={localBoard.id}
                list={list}
              />
            ))}

            {localBoard.lists.length === 0 && (
              <section className="flex w-72 shrink-0 flex-col rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground shadow-sm">
                <p className="font-medium text-foreground">No lists yet</p>
                <p className="mt-1">
                  Create your first list to start adding cards.
                </p>
              </section>
            )}

            <section className="w-72 shrink-0">
              <AddListForm boardId={localBoard.id} />
            </section>
          </div>

          <DragOverlay>
            {activeCard ? (
              <CardShell card={activeCard} className="rotate-1 shadow-lg" />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

function BoardListSection({
  boardId,
  list,
}: {
  boardId: string
  list: BoardListWithCards
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: 'list',
      listId: list.id,
    },
  })
  const cardIds = useMemo(() => list.cards.map((card) => card.id), [list.cards])

  return (
    <section
      ref={setNodeRef}
      className={
        isOver
          ? 'flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-background shadow-md ring-2 ring-ring'
          : 'flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-background shadow-sm ring-1 ring-border'
      }
    >
      <div className="flex items-center justify-between gap-3 border-b px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <CircleDot aria-hidden="true" className="size-3.5" />
          </span>
          <h2 className="truncate text-sm font-semibold">{list.name}</h2>
          <Badge variant="outline">{list.cards.length}</Badge>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`${list.name} menu`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
          {list.cards.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
              Drop a card here.
            </div>
          ) : (
            list.cards.map((card) => <SortableCard key={card.id} card={card} />)
          )}
          <AddCardForm boardId={boardId} list={list} />
        </div>
      </SortableContext>
    </section>
  )
}

function SortableCard({ card }: { card: BoardCard }) {
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
          ? 'cursor-grabbing rounded-lg bg-card p-3 text-card-foreground opacity-50 shadow-sm ring-2 ring-ring'
          : 'cursor-grab rounded-lg bg-card p-3 text-card-foreground shadow-sm ring-1 ring-border transition-all hover:-translate-y-px hover:shadow-md'
      }
    >
      <CardShell card={card} />
    </article>
  )
}

function CardShell({
  card,
  className,
}: {
  card: BoardCard
  className?: string
}) {
  return (
    <div
      className={
        className
          ? `rounded-lg bg-card p-3 text-card-foreground ring-1 ring-border ${className}`
          : undefined
      }
    >
      <div className="flex items-start gap-2">
        <GripVertical
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug">{card.title}</h3>
          {card.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {card.description}
            </p>
          )}
        </div>
      </div>
      {card.description && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare aria-hidden="true" className="size-3.5" />
          <span>Has notes</span>
        </div>
      )}
    </div>
  )
}

function findCard(board: BoardDetail, cardId: string) {
  for (const list of board.lists) {
    const card = list.cards.find((listCard) => listCard.id === cardId)

    if (card) {
      return card
    }
  }

  return null
}

function getDropTarget(board: BoardDetail, overId: string) {
  const overList = board.lists.find((list) => list.id === overId)

  if (overList) {
    return {
      toListId: overList.id,
      toIndex: overList.cards.length,
    }
  }

  for (const list of board.lists) {
    const cardIndex = list.cards.findIndex((card) => card.id === overId)

    if (cardIndex >= 0) {
      return {
        toListId: list.id,
        toIndex: cardIndex,
      }
    }
  }

  return null
}

function AddListForm({ boardId }: { boardId: string }) {
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
        className="h-12 w-full justify-start border-dashed bg-background shadow-sm"
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
      className="flex flex-col gap-2 rounded-xl bg-background p-2 shadow-sm ring-1 ring-border"
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
  const [description, setDescription] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    try {
      await createCardMutation.mutateAsync({
        listId: list.id,
        title: title.trim(),
        description: description.trim() || undefined,
      })
      setTitle('')
      setDescription('')
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
        className="justify-start text-muted-foreground hover:text-foreground"
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
      className="flex flex-col gap-2 rounded-lg bg-muted/30 p-2 ring-1 ring-border"
    >
      <Input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Card title"
      />
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
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
