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
  CalendarDays,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleDot,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  FolderPlus,
  GripVertical,
  Layers,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Palette,
  PanelTop,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Settings,
  Square,
  SquareCheckBig,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  useDeleteCardMutation,
  useDeleteListMutation,
  useMoveCardMutation,
  useToggleBoardStarMutation,
  useUpdateCardMutation,
  useUpdateListMutation,
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

type BoardTheme = {
  canvas: string
  name: string
  swatch: string
}

type ListColor = {
  bar: string
  icon: string
}

type CardColor = {
  bar: string
  mutedBar: string
}

const boardThemes: BoardTheme[] = [
  {
    name: 'Sky',
    canvas:
      'bg-[radial-gradient(circle_at_top_left,_oklch(0.83_0.11_231),_transparent_34rem),linear-gradient(135deg,_oklch(0.74_0.12_234),_oklch(0.58_0.13_258))]',
    swatch: 'bg-sky-500',
  },
  {
    name: 'Violet',
    canvas:
      'bg-[radial-gradient(circle_at_top_left,_oklch(0.80_0.12_310),_transparent_34rem),linear-gradient(135deg,_oklch(0.67_0.16_294),_oklch(0.53_0.18_281))]',
    swatch: 'bg-violet-500',
  },
  {
    name: 'Lagoon',
    canvas:
      'bg-[radial-gradient(circle_at_top_left,_oklch(0.82_0.13_174),_transparent_34rem),linear-gradient(135deg,_oklch(0.69_0.13_181),_oklch(0.50_0.12_210))]',
    swatch: 'bg-teal-500',
  },
  {
    name: 'Coral',
    canvas:
      'bg-[radial-gradient(circle_at_top_left,_oklch(0.83_0.13_53),_transparent_34rem),linear-gradient(135deg,_oklch(0.73_0.16_42),_oklch(0.58_0.16_22))]',
    swatch: 'bg-orange-500',
  },
]

const listColors: ListColor[] = [
  {
    bar: 'bg-sky-500',
    icon: 'bg-sky-100 text-sky-700',
  },
  {
    bar: 'bg-violet-500',
    icon: 'bg-violet-100 text-violet-700',
  },
  {
    bar: 'bg-emerald-500',
    icon: 'bg-emerald-100 text-emerald-700',
  },
  {
    bar: 'bg-amber-500',
    icon: 'bg-amber-100 text-amber-700',
  },
  {
    bar: 'bg-rose-500',
    icon: 'bg-rose-100 text-rose-700',
  },
]

const cardColors: CardColor[] = [
  {
    bar: 'bg-sky-500',
    mutedBar: 'bg-sky-200',
  },
  {
    bar: 'bg-violet-500',
    mutedBar: 'bg-violet-200',
  },
  {
    bar: 'bg-emerald-500',
    mutedBar: 'bg-emerald-200',
  },
  {
    bar: 'bg-amber-500',
    mutedBar: 'bg-amber-200',
  },
  {
    bar: 'bg-rose-500',
    mutedBar: 'bg-rose-200',
  },
]

function BoardPage() {
  const { boardId } = Route.useParams()
  const boardQuery = useBoardQuery(boardId)
  const board = boardQuery.data?.data.board
  const toggleStarMutation = useToggleBoardStarMutation(boardId)
  const moveCardMutation = useMoveCardMutation(boardId)
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null)
  const [query, setQuery] = useState('')
  const [themeIndex, setThemeIndex] = useState(0)
  const [compactCards, setCompactCards] = useState(false)
  const [hideCompletedCards, setHideCompletedCards] = useState(false)
  const [collapsedListIds, setCollapsedListIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [cardColorById, setCardColorById] = useState<Record<string, CardColor>>(
    {},
  )
  const [watchedCardIds, setWatchedCardIds] = useState<Set<string>>(
    () => new Set(),
  )
  const localBoard = board ?? null
  const normalizedQuery = query.trim().toLowerCase()
  const visibleLists = useMemo(() => {
    if (!localBoard || !normalizedQuery) {
      return localBoard?.lists ?? []
    }

    return localBoard.lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        if (hideCompletedCards && card.completed) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        return [card.title, card.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      }),
    }))
  }, [hideCompletedCards, localBoard, normalizedQuery])
  const totalCards =
    localBoard?.lists.reduce((total, list) => total + list.cards.length, 0) ?? 0
  const visibleCards = visibleLists.reduce(
    (total, list) => total + list.cards.length,
    0,
  )
  const boardTheme = boardThemes[themeIndex]
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

  function handleToggleList(listId: string) {
    setCollapsedListIds((current) => {
      const next = new Set(current)

      if (next.has(listId)) {
        next.delete(listId)
      } else {
        next.add(listId)
      }

      return next
    })
  }

  function handleSetCardColor(cardId: string, color: CardColor) {
    setCardColorById((current) => ({
      ...current,
      [cardId]: color,
    }))
  }

  function handleToggleWatchedCard(cardId: string) {
    setWatchedCardIds((current) => {
      const next = new Set(current)

      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }

      return next
    })
  }

  function handleCollapseAllLists() {
    if (!localBoard) {
      return
    }

    setCollapsedListIds(new Set(localBoard.lists.map((list) => list.id)))
  }

  function handleExpandAllLists() {
    setCollapsedListIds(new Set())
  }

  async function handleCopyBoardLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Board link copied.')
    } catch {
      toast.error('Unable to copy board link.')
    }
  }

  return (
    <div
      className={`flex h-full flex-col overflow-hidden ${boardTheme.canvas}`}
    >
      <div className="border-b border-white/20 bg-background/85 px-4 py-3 shadow-sm backdrop-blur-xl">
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
                  <Badge variant="outline">
                    {totalCards} {totalCards === 1 ? 'card' : 'cards'}
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
            <div className="relative min-w-52">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="h-8 bg-background/80 pl-8"
                placeholder="Filter cards"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter data-icon="inline-start" />
                  Theme
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Board color</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {boardThemes.map((theme, index) => (
                    <DropdownMenuItem
                      key={theme.name}
                      onSelect={() => setThemeIndex(index)}
                    >
                      <span
                        className={`size-3 rounded-full ${theme.swatch}`}
                        aria-hidden="true"
                      />
                      {theme.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {board && (
              <BoardSettingsMenu
                board={board}
                boardTheme={boardTheme}
                compactCards={compactCards}
                hideCompletedCards={hideCompletedCards}
                isAllCollapsed={
                  localBoard
                    ? collapsedListIds.size === localBoard.lists.length &&
                      localBoard.lists.length > 0
                    : false
                }
                themeIndex={themeIndex}
                totalCards={totalCards}
                visibleCards={visibleCards}
                onCollapseAll={handleCollapseAllLists}
                onCopyBoardLink={() => void handleCopyBoardLink()}
                onExpandAll={handleExpandAllLists}
                onSetCompactCards={setCompactCards}
                onSetHideCompletedCards={setHideCompletedCards}
                onSetThemeIndex={setThemeIndex}
                onRefresh={() => void boardQuery.refetch()}
                onToggleStar={() => void handleToggleStar(board)}
                toggleStarPending={toggleStarMutation.isPending}
              />
            )}
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
        {board && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Button variant="secondary" size="sm">
              <LayoutGrid data-icon="inline-start" />
              Board
            </Button>
            <Badge variant="secondary">
              {normalizedQuery
                ? `${visibleCards} matching ${visibleCards === 1 ? 'card' : 'cards'}`
                : 'All cards visible'}
            </Badge>
            <Badge variant="outline">
              <CalendarDays aria-hidden="true" />
              Updated {new Date(board.updatedAt).toLocaleDateString()}
            </Badge>
          </div>
        )}
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
            {visibleLists.map((list, index) => (
              <BoardListSection
                key={list.id}
                boardId={localBoard.id}
                list={list}
                color={listColors[index % listColors.length]}
                cardColorById={cardColorById}
                compactCards={compactCards}
                isCollapsed={collapsedListIds.has(list.id)}
                isFiltering={Boolean(normalizedQuery)}
                watchedCardIds={watchedCardIds}
                onSetCardColor={handleSetCardColor}
                onToggleCollapsed={() => handleToggleList(list.id)}
                onToggleWatchedCard={handleToggleWatchedCard}
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

function BoardSettingsMenu({
  board,
  boardTheme,
  compactCards,
  hideCompletedCards,
  isAllCollapsed,
  themeIndex,
  totalCards,
  visibleCards,
  toggleStarPending,
  onCollapseAll,
  onCopyBoardLink,
  onExpandAll,
  onRefresh,
  onSetCompactCards,
  onSetHideCompletedCards,
  onSetThemeIndex,
  onToggleStar,
}: {
  board: BoardDetail
  boardTheme: BoardTheme
  compactCards: boolean
  hideCompletedCards: boolean
  isAllCollapsed: boolean
  themeIndex: number
  totalCards: number
  visibleCards: number
  toggleStarPending: boolean
  onCollapseAll: () => void
  onCopyBoardLink: () => void
  onExpandAll: () => void
  onRefresh: () => void
  onSetCompactCards: (compact: boolean) => void
  onSetHideCompletedCards: (hideCompleted: boolean) => void
  onSetThemeIndex: (themeIndex: number) => void
  onToggleStar: () => void
}) {
  const completedCards = board.lists.reduce(
    (total, list) => total + list.cards.filter((card) => card.completed).length,
    0,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings data-icon="inline-start" />
          Board settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <span className="block truncate text-sm text-foreground">
            {board.name}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {board.workspaceName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={onToggleStar}
            disabled={toggleStarPending}
          >
            <Star
              aria-hidden="true"
              className={board.isStarred ? 'fill-current' : undefined}
            />
            {board.isStarred ? 'Remove from favorites' : 'Add to favorites'}
          </DropdownMenuItem>
          <EditBoardDialog board={board}>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              <Pencil aria-hidden="true" />
              Edit board details
            </DropdownMenuItem>
          </EditBoardDialog>
          <DropdownMenuItem onSelect={onCopyBoardLink}>
            <Copy aria-hidden="true" />
            Copy board link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onRefresh}>
            <RefreshCw aria-hidden="true" />
            Refresh board
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Board view</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={compactCards}
            onCheckedChange={onSetCompactCards}
          >
            Compact cards
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={hideCompletedCards}
            onCheckedChange={onSetHideCompletedCards}
          >
            Hide completed cards
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem
            onSelect={isAllCollapsed ? onExpandAll : onCollapseAll}
          >
            {isAllCollapsed ? (
              <ChevronsUpDown aria-hidden="true" />
            ) : (
              <ChevronsDownUp aria-hidden="true" />
            )}
            {isAllCollapsed ? 'Expand all lists' : 'Collapse all lists'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette aria-hidden="true" className="size-4" />
          Board color
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {boardThemes.map((theme, index) => (
            <DropdownMenuItem
              key={theme.name}
              onSelect={() => onSetThemeIndex(index)}
            >
              <span
                className={`size-3 rounded-full ${theme.swatch}`}
                aria-hidden="true"
              />
              {theme.name}
              {themeIndex === index && (
                <Badge className="ml-auto" variant="secondary">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-3 gap-2 p-1">
          <BoardMenuStat label="Theme" value={boardTheme.name} />
          <BoardMenuStat label="Cards" value={visibleCards} />
          <BoardMenuStat label="Done" value={completedCards} />
        </div>
        {hideCompletedCards && (
          <p className="px-1.5 pb-1 text-xs text-muted-foreground">
            Showing {visibleCards} of {totalCards} cards.
          </p>
        )}
        <DropdownMenuSeparator />
        <DeleteBoardDialog board={board} navigateToDashboard>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => event.preventDefault()}
          >
            <Trash2 aria-hidden="true" />
            Delete board
          </DropdownMenuItem>
        </DeleteBoardDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BoardMenuStat({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="truncate text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function BoardListSection({
  boardId,
  cardColorById,
  compactCards,
  color,
  isCollapsed,
  isFiltering,
  list,
  watchedCardIds,
  onSetCardColor,
  onToggleCollapsed,
  onToggleWatchedCard,
}: {
  boardId: string
  cardColorById: Record<string, CardColor>
  compactCards: boolean
  color: ListColor
  isCollapsed: boolean
  isFiltering: boolean
  list: BoardListWithCards
  watchedCardIds: Set<string>
  onSetCardColor: (cardId: string, color: CardColor) => void
  onToggleCollapsed: () => void
  onToggleWatchedCard: (cardId: string) => void
}) {
  const createCardMutation = useCreateCardMutation(boardId)
  const createListMutation = useCreateListMutation(boardId)
  const deleteCardMutation = useDeleteCardMutation(boardId)
  const deleteListMutation = useDeleteListMutation(boardId)
  const updateListMutation = useUpdateListMutation(boardId)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
          ? 'flex max-h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-background/95 shadow-xl ring-2 ring-ring'
          : 'flex max-h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-background/95 shadow-lg shadow-foreground/5 ring-1 ring-white/70'
      }
    >
      <div className={`h-2 ${color.bar}`} />
      <div className="flex items-center justify-between gap-3 border-b bg-background/80 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex size-6 items-center justify-center rounded-md ${color.icon}`}
          >
            <CircleDot aria-hidden="true" className="size-3.5" />
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
              <DropdownMenuItem disabled>
                <FolderPlus aria-hidden="true" />
                Move list
              </DropdownMenuItem>
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
        <DeleteListDialog
          deleteListMutation={deleteListMutation}
          list={list}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        {!isCollapsed && (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-muted/35 p-2">
            {list.cards.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-background/70 p-3 text-sm text-muted-foreground">
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
                  isWatched={watchedCardIds.has(card.id)}
                  compact={compactCards}
                  onSetCardColor={onSetCardColor}
                  onToggleWatchedCard={onToggleWatchedCard}
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

function SortableCard({
  boardId,
  card,
  compact,
  color,
  isWatched,
  onSetCardColor,
  onToggleWatchedCard,
}: {
  boardId: string
  card: BoardCard
  compact: boolean
  color: CardColor
  isWatched: boolean
  onSetCardColor: (cardId: string, color: CardColor) => void
  onToggleWatchedCard: (cardId: string) => void
}) {
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
      <CardShell
        boardId={boardId}
        card={card}
        compact={compact}
        color={color}
        isWatched={isWatched}
        onSetCardColor={onSetCardColor}
        onToggleWatchedCard={onToggleWatchedCard}
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
      <DialogContent>
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

function CardShell({
  boardId,
  card,
  className,
  compact = false,
  color = cardColors[0],
  isWatched = false,
  onSetCardColor,
  onToggleWatchedCard,
}: {
  boardId?: string
  card: BoardCard
  className?: string
  compact?: boolean
  color?: CardColor
  isWatched?: boolean
  onSetCardColor?: (cardId: string, color: CardColor) => void
  onToggleWatchedCard?: (cardId: string) => void
}) {
  const updateCardMutation = useUpdateCardMutation(boardId ?? '')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

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
      <button
        type="button"
        className={
          className
            ? `group/card-button w-full rounded-lg bg-card p-3 text-left text-card-foreground ring-1 ring-border transition-all hover:ring-primary/70 focus-visible:ring-2 focus-visible:ring-primary ${className}`
            : 'group/card-button w-full rounded-lg bg-card p-3 text-left text-card-foreground ring-1 ring-border transition-all hover:ring-primary/70 focus-visible:ring-2 focus-visible:ring-primary'
        }
        onClick={() => setDetailsOpen(true)}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-10 rounded-full ${color.bar}`} />
            {card.description && (
              <span className={`h-1.5 w-6 rounded-full ${color.mutedBar}`} />
            )}
          </div>
          {boardId && onSetCardColor && onToggleWatchedCard && (
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover/card-button:opacity-100 md:group-focus-visible/card-button:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Quick edit ${card.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setEditOpen(true)
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Edit3 aria-hidden="true" />
              </Button>
              <CardSettingsMenu
                boardId={boardId}
                card={card}
                color={color}
                isWatched={isWatched}
                onSetCardColor={onSetCardColor}
                onToggleWatchedCard={onToggleWatchedCard}
              />
            </div>
          )}
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex shrink-0 items-center gap-1">
            {boardId ? (
              <span
                className="flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                className="size-4 text-muted-foreground"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={
                card.completed
                  ? 'break-words text-sm font-medium leading-snug text-muted-foreground line-through'
                  : 'break-words text-sm font-medium leading-snug'
              }
            >
              {card.title}
            </h3>
            {card.description && !compact && (
              <p className="mt-1 line-clamp-3 break-words text-xs leading-5 text-muted-foreground">
                {card.description}
              </p>
            )}
          </div>
        </div>
        {(card.description || card.completed || isWatched) && !compact && (
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
                  <MessageSquare aria-hidden="true" className="size-3.5" />
                  Has notes
                </span>
              )}
              {isWatched && (
                <span className="flex items-center gap-1.5">
                  <Eye aria-hidden="true" className="size-3.5" />
                  Watching
                </span>
              )}
            </div>
            <Badge variant="outline">Card</Badge>
          </div>
        )}
      </button>
      {boardId && (
        <EditCardDialog
          card={card}
          open={editOpen}
          onOpenChange={setEditOpen}
          updateCardMutation={updateCardMutation}
        />
      )}
      <CardDetailDialog
        card={card}
        color={color}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  )
}

function CardSettingsMenu({
  boardId,
  card,
  color,
  isWatched,
  onSetCardColor,
  onToggleWatchedCard,
}: {
  boardId: string
  card: BoardCard
  color: CardColor
  isWatched: boolean
  onSetCardColor: (cardId: string, color: CardColor) => void
  onToggleWatchedCard: (cardId: string) => void
}) {
  const createCardMutation = useCreateCardMutation(boardId)
  const deleteCardMutation = useDeleteCardMutation(boardId)
  const moveCardMutation = useMoveCardMutation(boardId)
  const updateCardMutation = useUpdateCardMutation(boardId)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

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
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Card settings">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Card settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setDetailsOpen(true)
              }}
            >
              <PanelTop aria-hidden="true" />
              Open card
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setEditOpen(true)
              }}
            >
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
            <DropdownMenuItem onSelect={() => onToggleWatchedCard(card.id)}>
              {isWatched ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
              {isWatched ? 'Stop watching' : 'Watch card'}
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
              setDeleteOpen(true)
            }}
          >
            <Trash2 aria-hidden="true" />
            Delete card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditCardDialog
        card={card}
        open={editOpen}
        onOpenChange={setEditOpen}
        updateCardMutation={updateCardMutation}
      />
      <DeleteCardDialog
        card={card}
        deleteCardMutation={deleteCardMutation}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <CardDetailDialog
        card={card}
        color={color}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}

function EditCardDialog({
  card,
  open,
  onOpenChange,
  updateCardMutation,
}: {
  card: BoardCard
  open: boolean
  onOpenChange: (open: boolean) => void
  updateCardMutation: ReturnType<typeof useUpdateCardMutation>
}) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
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
          description: description.trim() || null,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
          <DialogDescription>
            Update this card title and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor={`card-title-${card.id}`}
            >
              Title
            </label>
            <Input
              id={`card-title-${card.id}`}
              value={title}
              aria-invalid={Boolean(titleError)}
              onChange={(event) => setTitle(event.target.value)}
            />
            {titleError && (
              <p className="text-sm text-destructive">{titleError}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor={`card-description-${card.id}`}
            >
              Description
            </label>
            <Textarea
              id={`card-description-${card.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
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
      <DialogContent>
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

function CardDetailDialog({
  card,
  color,
  open,
  onOpenChange,
}: {
  card: BoardCard
  color: CardColor
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-3rem)] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                List
              </Button>
              <Badge variant={card.completed ? 'secondary' : 'outline'}>
                {card.completed ? 'Complete' : 'Open'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-12 rounded-full ${color.bar}`} />
              {card.description && (
                <span className={`h-1.5 w-8 rounded-full ${color.mutedBar}`} />
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="grid min-h-[28rem] overflow-hidden md:grid-cols-[1fr_28rem]">
          <section className="min-w-0 overflow-y-auto px-6 py-6">
            <div className="flex items-start gap-4">
              {card.completed ? (
                <SquareCheckBig
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-green-600"
                />
              ) : (
                <Square
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-muted-foreground"
                />
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-3xl leading-tight font-semibold tracking-tight">
                  {card.title}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  Card #{card.position + 1}
                </DialogDescription>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pl-9">
              <Button variant="outline" size="sm">
                <PlusCircle data-icon="inline-start" />
                Add
              </Button>
              <Button variant="outline" size="sm">
                <Palette data-icon="inline-start" />
                Labels
              </Button>
              <Button variant="outline" size="sm">
                <CalendarDays data-icon="inline-start" />
                Dates
              </Button>
              <Button variant="outline" size="sm">
                <SquareCheckBig data-icon="inline-start" />
                Checklist
              </Button>
              <Button variant="outline" size="sm">
                <Users data-icon="inline-start" />
                Members
              </Button>
            </div>

            <section className="mt-8 pl-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MessageSquare
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Description</h3>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="mt-4 rounded-lg bg-muted/40 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {card.description || 'No description yet.'}
                </p>
              </div>
            </section>
          </section>

          <aside className="border-t bg-muted/35 px-4 py-5 md:border-t-0 md:border-l">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <h3 className="font-semibold">Comments and activity</h3>
              </div>
              <Button variant="outline" size="sm">
                Show details
              </Button>
            </div>

            <Input
              className="mt-4 bg-background"
              placeholder="Write a comment..."
            />

            <div className="mt-4 flex items-start gap-3">
              <Avatar className="bg-orange-500 text-white" size="sm">
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm">
                <p>
                  <span className="font-semibold">Alex Langidis</span> added
                  this card to the board
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
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
        className="h-12 w-full justify-start border-white/70 bg-background/90 shadow-lg shadow-foreground/5"
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
      className="flex flex-col gap-2 rounded-xl bg-background p-2 shadow-lg ring-1 ring-border"
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
        className="justify-start rounded-lg bg-background/70 text-muted-foreground ring-1 ring-border hover:text-foreground"
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
      className="flex flex-col gap-2 rounded-lg bg-background p-2 shadow-sm ring-1 ring-border"
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
