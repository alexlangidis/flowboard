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
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  Bookmark,
  Bug,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleDot,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Flag,
  Flame,
  GripVertical,
  Layers,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Palette,
  PanelTop,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Square,
  SquareCheckBig,
  Star,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { FormEvent, RefObject } from 'react'

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
  useCreateCardCommentMutation,
  useCreateListMutation,
  useDeleteCardCommentMutation,
  useDeleteCardMutation,
  useDeleteListMutation,
  useMoveCardMutation,
  useMoveListMutation,
  useToggleBoardStarMutation,
  useUpdateCardMutation,
  useUpdateCardCommentMutation,
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
  name: string
  swatch: string
}

type ListIcon = {
  icon: typeof CircleDot
  name: string
}

type CardColor = {
  bar: string
  mutedBar: string
}

type ChecklistItem = {
  id: string
  completed: boolean
  text: string
}

type CardAttachmentItem = {
  file: File
  id: string
  name: string
  size: number
  url: string
}

const boardThemes: BoardTheme[] = [
  {
    name: 'Sky',
    canvas:
      'bg-[radial-gradient(circle_at_12%_8%,_rgba(255,255,255,0.72),_transparent_28rem),radial-gradient(circle_at_82%_16%,_oklch(0.80_0.11_224_/_0.92),_transparent_30rem),linear-gradient(135deg,_oklch(0.78_0.11_222),_oklch(0.59_0.15_252))]',
    swatch: 'bg-sky-500',
  },
  {
    name: 'Aurora',
    canvas:
      'bg-[radial-gradient(circle_at_14%_10%,_oklch(0.88_0.10_330_/_0.86),_transparent_28rem),radial-gradient(circle_at_78%_18%,_oklch(0.79_0.14_178_/_0.78),_transparent_30rem),linear-gradient(135deg,_oklch(0.68_0.16_292),_oklch(0.55_0.16_240))]',
    swatch: 'bg-violet-500',
  },
  {
    name: 'Lagoon',
    canvas:
      'bg-[radial-gradient(circle_at_12%_8%,_oklch(0.90_0.08_175_/_0.82),_transparent_28rem),radial-gradient(circle_at_84%_18%,_oklch(0.72_0.13_190_/_0.78),_transparent_30rem),linear-gradient(135deg,_oklch(0.70_0.13_181),_oklch(0.50_0.12_210))]',
    swatch: 'bg-teal-500',
  },
  {
    name: 'Coral',
    canvas:
      'bg-[radial-gradient(circle_at_14%_8%,_oklch(0.91_0.10_70_/_0.86),_transparent_28rem),radial-gradient(circle_at_80%_18%,_oklch(0.77_0.15_22_/_0.75),_transparent_30rem),linear-gradient(135deg,_oklch(0.73_0.16_42),_oklch(0.57_0.16_18))]',
    swatch: 'bg-orange-500',
  },
  {
    name: 'Slate',
    canvas:
      'bg-[radial-gradient(circle_at_12%_8%,_oklch(0.80_0.05_245_/_0.56),_transparent_28rem),radial-gradient(circle_at_82%_12%,_oklch(0.62_0.10_225_/_0.62),_transparent_30rem),linear-gradient(135deg,_oklch(0.45_0.07_250),_oklch(0.33_0.05_260))]',
    swatch: 'bg-slate-600',
  },
]

const listColors: ListColor[] = [
  {
    bar: 'bg-sky-500',
    icon: 'bg-sky-100 text-sky-700',
    name: 'Sky',
    swatch: 'bg-sky-500',
  },
  {
    bar: 'bg-violet-500',
    icon: 'bg-violet-100 text-violet-700',
    name: 'Violet',
    swatch: 'bg-violet-500',
  },
  {
    bar: 'bg-emerald-500',
    icon: 'bg-emerald-100 text-emerald-700',
    name: 'Emerald',
    swatch: 'bg-emerald-500',
  },
  {
    bar: 'bg-amber-500',
    icon: 'bg-amber-100 text-amber-700',
    name: 'Amber',
    swatch: 'bg-amber-500',
  },
  {
    bar: 'bg-rose-500',
    icon: 'bg-rose-100 text-rose-700',
    name: 'Rose',
    swatch: 'bg-rose-500',
  },
]

const listIcons: ListIcon[] = [
  { name: 'Circle', icon: CircleDot },
  { name: 'Board', icon: LayoutGrid },
  { name: 'Panel', icon: PanelTop },
  { name: 'Done', icon: CheckCircle2 },
  { name: 'Square', icon: Square },
  { name: 'Tasks', icon: ClipboardList },
  { name: 'Flag', icon: Flag },
  { name: 'Rocket', icon: Rocket },
  { name: 'Target', icon: Target },
  { name: 'Flame', icon: Flame },
  { name: 'Bug', icon: Bug },
  { name: 'Bookmark', icon: Bookmark },
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
  const moveListMutation = useMoveListMutation(boardId)
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
  const [listColorById, setListColorById] = useState<Record<string, ListColor>>(
    {},
  )
  const [listIconById, setListIconById] = useState<Record<string, ListIcon>>({})
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

  function handleSetListColor(listId: string, color: ListColor) {
    setListColorById((current) => ({
      ...current,
      [listId]: color,
    }))
  }

  function handleSetListIcon(listId: string, icon: ListIcon) {
    setListIconById((current) => ({
      ...current,
      [listId]: icon,
    }))
  }

  async function handleMoveList(listId: string, toIndex: number) {
    try {
      await moveListMutation.mutateAsync({ listId, toIndex })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to move list.',
      )
    }
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

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden ${boardTheme.canvas}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.22),_transparent_34%,_rgba(255,255,255,0.10)_65%,_transparent)]" />
      <div className="relative z-10 border-b border-white/35 bg-white/45 px-4 py-3 shadow-lg shadow-foreground/10 backdrop-blur-2xl dark:bg-background/45">
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
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
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
                  <Badge className="border-white/55 bg-white/55 text-foreground shadow-sm backdrop-blur-xl">
                    {board.visibility}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/55 bg-white/35 text-foreground shadow-sm backdrop-blur-xl"
                  >
                    {board.lists.length}{' '}
                    {board.lists.length === 1 ? 'list' : 'lists'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/55 bg-white/35 text-foreground shadow-sm backdrop-blur-xl"
                  >
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
                className="h-8 border-white/50 bg-white/65 pl-8 shadow-sm backdrop-blur-xl dark:bg-background/65"
                placeholder="Filter cards"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {board && (
              <BoardSettingsMenu
                board={board}
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
                onExpandAll={handleExpandAllLists}
                onSetCompactCards={setCompactCards}
                onSetHideCompletedCards={setHideCompletedCards}
                onSetThemeIndex={setThemeIndex}
                onRefresh={() => void boardQuery.refetch()}
                onToggleStar={() => void handleToggleStar(board)}
                toggleStarPending={toggleStarMutation.isPending}
              />
            )}
            {board && (
              <>
                <EditBoardDialog board={board}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/55 bg-white/55 shadow-sm backdrop-blur-xl hover:bg-white/75 dark:bg-background/55"
                  >
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                </EditBoardDialog>
                <DeleteBoardDialog board={board} navigateToDashboard>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300/60 bg-red-500/10 text-red-700 shadow-sm backdrop-blur-xl hover:bg-red-500/15 hover:text-red-800 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
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
            <Button
              variant="secondary"
              size="sm"
              className="border border-white/55 bg-white/60 shadow-sm backdrop-blur-xl hover:bg-white/80 dark:bg-background/60"
            >
              <LayoutGrid data-icon="inline-start" />
              Board
            </Button>
            <Badge className="border-white/55 bg-white/45 text-foreground shadow-sm backdrop-blur-xl">
              {normalizedQuery
                ? `${visibleCards} matching ${visibleCards === 1 ? 'card' : 'cards'}`
                : 'All cards visible'}
            </Badge>
            <Badge
              variant="outline"
              className="border-white/55 bg-white/35 text-foreground shadow-sm backdrop-blur-xl"
            >
              <CalendarDays aria-hidden="true" />
              Updated {new Date(board.updatedAt).toLocaleDateString()}
            </Badge>
          </div>
        )}
      </div>

      {boardQuery.isLoading ? (
        <div className="relative z-10 flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 md:p-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="flex max-h-full w-72 shrink-0 flex-col rounded-2xl border border-white/45 bg-white/40 p-3 shadow-xl shadow-foreground/10 backdrop-blur-2xl"
            >
              <div className="h-5 w-32 rounded bg-white/55" />
              <Separator className="my-3" />
              <div className="flex flex-col gap-2">
                <div className="h-24 rounded-lg bg-white/55" />
                <div className="h-16 rounded-lg bg-white/55" />
              </div>
            </section>
          ))}
        </div>
      ) : boardQuery.isError || !localBoard ? (
        <div className="relative z-10 flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/45 bg-white/65 p-6 text-center shadow-xl shadow-foreground/10 backdrop-blur-2xl">
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
          <div className="relative z-10 flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 md:p-5">
            {visibleLists.map((list, index) => (
              <BoardListSection
                key={list.id}
                boardId={localBoard.id}
                listCount={visibleLists.length}
                listIndex={index}
                list={list}
                color={
                  listColorById[list.id] ??
                  listColors[index % listColors.length]
                }
                cardColorById={cardColorById}
                compactCards={compactCards}
                icon={listIconById[list.id] ?? listIcons[0]}
                isCollapsed={collapsedListIds.has(list.id)}
                isFiltering={Boolean(normalizedQuery)}
                isMovingList={moveListMutation.isPending}
                watchedCardIds={watchedCardIds}
                onSetCardColor={handleSetCardColor}
                onSetListColor={handleSetListColor}
                onSetListIcon={handleSetListIcon}
                onMoveList={handleMoveList}
                onToggleCollapsed={() => handleToggleList(list.id)}
                onToggleWatchedCard={handleToggleWatchedCard}
              />
            ))}

            {localBoard.lists.length === 0 && (
              <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-dashed border-white/65 bg-white/50 p-4 text-sm text-muted-foreground shadow-xl shadow-foreground/10 backdrop-blur-2xl dark:bg-background/50">
                <span className="mb-3 flex size-9 items-center justify-center rounded-xl bg-white/65 text-foreground shadow-sm">
                  <PanelTop aria-hidden="true" className="size-4" />
                </span>
                <p className="font-semibold text-foreground">No lists yet</p>
                <p className="mt-1 leading-6">
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
  compactCards,
  hideCompletedCards,
  isAllCollapsed,
  themeIndex,
  totalCards,
  visibleCards,
  toggleStarPending,
  onCollapseAll,
  onExpandAll,
  onRefresh,
  onSetCompactCards,
  onSetHideCompletedCards,
  onSetThemeIndex,
  onToggleStar,
}: {
  board: BoardDetail
  compactCards: boolean
  hideCompletedCards: boolean
  isAllCollapsed: boolean
  themeIndex: number
  totalCards: number
  visibleCards: number
  toggleStarPending: boolean
  onCollapseAll: () => void
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
                className={`size-3 rounded-full shadow-sm ring-1 ring-black/10 ${theme.swatch}`}
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
        <div className="grid grid-cols-2 gap-2 p-1">
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
  icon,
  isCollapsed,
  isFiltering,
  isMovingList,
  list,
  listCount,
  listIndex,
  watchedCardIds,
  onMoveList,
  onSetCardColor,
  onSetListColor,
  onSetListIcon,
  onToggleCollapsed,
  onToggleWatchedCard,
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
  watchedCardIds: Set<string>
  onMoveList: (listId: string, toIndex: number) => Promise<void> | void
  onSetCardColor: (cardId: string, color: CardColor) => void
  onSetListColor: (listId: string, color: ListColor) => void
  onSetListIcon: (listId: string, icon: ListIcon) => void
  onToggleCollapsed: () => void
  onToggleWatchedCard: (cardId: string) => void
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
        isWatched={isWatched}
        onInteractionOpenChange={setIsCardInteractionOpen}
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

function CardShell({
  boardId,
  card,
  className,
  compact = false,
  color = cardColors[0],
  isWatched = false,
  onInteractionOpenChange,
  onSetCardColor,
  onToggleWatchedCard,
}: {
  boardId?: string
  card: BoardCard
  className?: string
  compact?: boolean
  color?: CardColor
  isWatched?: boolean
  onInteractionOpenChange?: (open: boolean) => void
  onSetCardColor?: (cardId: string, color: CardColor) => void
  onToggleWatchedCard?: (cardId: string) => void
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
                  handleEditOpenChange(true)
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Edit3 aria-hidden="true" />
              </Button>
              <CardSettingsMenu
                boardId={boardId}
                card={card}
                isWatched={isWatched}
                onInteractionOpenChange={onInteractionOpenChange}
                onEditCard={() => handleEditOpenChange(true)}
                onOpenCard={() => handleDetailsOpenChange(true)}
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
                  Description
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
      </div>
      {boardId && (
        <EditCardDialog
          card={card}
          open={editOpen}
          onOpenChange={handleEditOpenChange}
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
  isWatched,
  onInteractionOpenChange,
  onEditCard,
  onOpenCard,
  onSetCardColor,
  onToggleWatchedCard,
}: {
  boardId: string
  card: BoardCard
  isWatched: boolean
  onInteractionOpenChange?: (open: boolean) => void
  onEditCard: () => void
  onOpenCard: () => void
  onSetCardColor: (cardId: string, color: CardColor) => void
  onToggleWatchedCard: (cardId: string) => void
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
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-lg"
        onPointerDownCapture={(event) => event.stopPropagation()}
      >
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
              className="max-w-full"
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
              className="max-h-64 max-w-full resize-y [field-sizing:fixed]"
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function CardDetailDialog({
  boardId,
  card,
  color,
  open,
  onOpenChange,
}: {
  boardId?: string
  card: BoardCard
  color: CardColor
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateCardMutation = useUpdateCardMutation(boardId ?? '')
  const createCommentMutation = useCreateCardCommentMutation(boardId ?? '')
  const updateCommentMutation = useUpdateCardCommentMutation(boardId ?? '')
  const deleteCommentMutation = useDeleteCardCommentMutation(boardId ?? '')
  const comments = card.comments ?? []
  const checklistRef = useRef<HTMLDivElement>(null)
  const attachmentsRef = useRef<HTMLDivElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<CardAttachmentItem[]>([])
  const [assignedMembers, setAssignedMembers] = useState<string[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checklistText, setChecklistText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [description, setDescription] = useState(card.description ?? '')
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(
    null,
  )
  const [editingAttachmentName, setEditingAttachmentName] = useState('')
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<
    string | null
  >(null)
  const [editingChecklistItemText, setEditingChecklistItemText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [hideCheckedItems, setHideCheckedItems] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const checklistCompletedCount = checklistItems.filter(
    (item) => item.completed,
  ).length
  const checklistProgress =
    checklistItems.length === 0
      ? 0
      : Math.round((checklistCompletedCount / checklistItems.length) * 100)
  const availableMembers = ['Alex Langidis', 'Demo User']
  const filteredMembers = availableMembers.filter((member) =>
    member.toLowerCase().includes(memberSearch.trim().toLowerCase()),
  )
  const visibleChecklistItems = hideCheckedItems
    ? checklistItems.filter((item) => !item.completed)
    : checklistItems

  function scrollToSection(ref: RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  async function handleSaveDescription() {
    if (!boardId) {
      return
    }

    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          description: description.trim() || null,
        },
      })
      setIsEditingDescription(false)
      toast.success('Description updated.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update description.',
      )
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!boardId || !commentText.trim()) {
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        cardId: card.id,
        input: {
          body: commentText.trim(),
        },
      })
      setCommentText('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add comment.',
      )
    }
  }

  async function handleSaveComment(commentId: string) {
    if (!boardId || !editingCommentText.trim()) {
      return
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        input: {
          body: editingCommentText.trim(),
        },
      })
      setEditingCommentId(null)
      setEditingCommentText('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update comment.',
      )
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!boardId) {
      return
    }

    try {
      await deleteCommentMutation.mutateAsync(commentId)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete comment.',
      )
    }
  }

  function handleAddChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!checklistText.trim()) {
      return
    }

    setChecklistItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        completed: false,
        text: checklistText.trim(),
      },
    ])
    setChecklistText('')
  }

  function handleSaveChecklistItem(itemId: string) {
    if (!editingChecklistItemText.trim()) {
      return
    }

    setChecklistItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              text: editingChecklistItemText.trim(),
            }
          : item,
      ),
    )
    setEditingChecklistItemId(null)
    setEditingChecklistItemText('')
  }

  function handleToggleAssignedMember(member: string) {
    setAssignedMembers((current) =>
      current.includes(member)
        ? current.filter((currentMember) => currentMember !== member)
        : [...current, member],
    )
  }

  function handleAddAttachments(files: FileList | null) {
    if (!files?.length) {
      return
    }

    setAttachments((current) => [
      ...current,
      ...Array.from(files).map((file) => ({
        file,
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      })),
    ])

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  function handleSaveAttachmentName(attachmentId: string) {
    if (!editingAttachmentName.trim()) {
      return
    }

    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === attachmentId
          ? {
              ...attachment,
              name: editingAttachmentName.trim(),
            }
          : attachment,
      ),
    )
    setEditingAttachmentId(null)
    setEditingAttachmentName('')
  }

  function handleDeleteAttachment(attachmentId: string) {
    setAttachments((current) => {
      const attachment = current.find((item) => item.id === attachmentId)

      if (attachment) {
        URL.revokeObjectURL(attachment.url)
      }

      return current.filter((item) => item.id !== attachmentId)
    })
  }

  function handleDownloadAttachment(attachment: CardAttachmentItem) {
    const anchor = document.createElement('a')

    anchor.href = attachment.url
    anchor.download = attachment.name
    anchor.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-5xl"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4 pr-10">
            <Badge
              variant="outline"
              className={
                card.completed
                  ? 'border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'border-white/55 bg-white/50 text-muted-foreground'
              }
            >
              {card.completed ? 'Complete' : 'Open'}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-12 rounded-full ${color.bar}`} />
              {card.description && (
                <span className={`h-1.5 w-8 rounded-full ${color.mutedBar}`} />
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_28rem]">
          <section className="min-h-0 min-w-0 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-4">
              {card.completed ? (
                <SquareCheckBig
                  aria-hidden="true"
                  className="size-5 shrink-0 text-emerald-600"
                />
              ) : (
                <Square
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground"
                />
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-3xl leading-tight font-semibold tracking-tight">
                  {card.title}
                </DialogTitle>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pl-9">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(checklistRef)}
              >
                <CheckCircle2 aria-hidden="true" />
                Checklist
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant={membersPopoverOpen ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMembersPopoverOpen((current) => !current)}
                >
                  <Users aria-hidden="true" />
                  Members
                </Button>
                {membersPopoverOpen && (
                  <div
                    className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-80 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl"
                    onPointerDownCapture={(event) => event.stopPropagation()}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex-1 text-center text-sm font-semibold">
                        Members
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Close members"
                        onClick={() => setMembersPopoverOpen(false)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </div>
                    <Input
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder="Search members"
                      autoFocus
                    />
                    <p className="mt-4 mb-2 text-xs font-semibold text-muted-foreground">
                      Board members
                    </p>
                    <div className="flex flex-col gap-1">
                      {filteredMembers.map((member) => {
                        const isAssigned = assignedMembers.includes(member)

                        return (
                          <button
                            key={member}
                            type="button"
                            className={
                              isAssigned
                                ? 'flex items-center gap-2 rounded-md bg-muted px-2 py-2 text-left text-sm'
                                : 'flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted'
                            }
                            onClick={() => handleToggleAssignedMember(member)}
                          >
                            <Avatar
                              className={
                                member === 'Alex Langidis'
                                  ? 'size-8 bg-orange-500 text-white'
                                  : 'size-8'
                              }
                            >
                              <AvatarFallback>
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1 truncate">
                              {member}
                            </span>
                            {isAssigned && (
                              <Check
                                aria-hidden="true"
                                className="size-4 text-emerald-600"
                              />
                            )}
                          </button>
                        )
                      })}
                      {filteredMembers.length === 0 && (
                        <p className="px-2 py-4 text-sm text-muted-foreground">
                          No members found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => attachmentInputRef.current?.click()}
              >
                <Paperclip aria-hidden="true" />
                Attachment
              </Button>
              <input
                ref={attachmentInputRef}
                className="sr-only"
                type="file"
                multiple
                onChange={(event) => handleAddAttachments(event.target.files)}
              />
            </div>

            <section className="mt-8 pl-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlignLeft
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Description</h3>
                </div>
                {!isEditingDescription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="mt-4 flex flex-col gap-3">
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add a description..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleSaveDescription()}
                      disabled={updateCardMutation.isPending}
                    >
                      {updateCardMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDescription(card.description ?? '')
                        setIsEditingDescription(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-muted/40 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {card.description || 'No description yet.'}
                  </p>
                </div>
              )}
            </section>

            <section ref={checklistRef} className="mt-8 pl-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Checklist</h3>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {checklistCompletedCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHideCheckedItems((current) => !current)}
                    >
                      {hideCheckedItems
                        ? 'Show checked items'
                        : 'Hide checked items'}
                    </Button>
                  )}
                  {checklistItems.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChecklistItems([])}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="w-9 text-xs text-muted-foreground">
                  {checklistProgress}%
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {visibleChecklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border bg-background/70 p-2"
                  >
                    <button
                      type="button"
                      className="mt-1 flex size-4 shrink-0 items-center justify-center rounded border border-input text-emerald-600"
                      aria-label={
                        item.completed
                          ? `Mark ${item.text} incomplete`
                          : `Mark ${item.text} complete`
                      }
                      onClick={() =>
                        setChecklistItems((current) =>
                          current.map((currentItem) =>
                            currentItem.id === item.id
                              ? {
                                  ...currentItem,
                                  completed: !currentItem.completed,
                                }
                              : currentItem,
                          ),
                        )
                      }
                    >
                      {item.completed && (
                        <Check aria-hidden="true" className="size-3" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      {editingChecklistItemId === item.id ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={editingChecklistItemText}
                            onChange={(event) =>
                              setEditingChecklistItemText(event.target.value)
                            }
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveChecklistItem(item.id)}
                              disabled={!editingChecklistItemText.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingChecklistItemId(null)
                                setEditingChecklistItemText('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={
                            item.completed
                              ? 'min-w-0 text-left text-sm text-muted-foreground line-through'
                              : 'min-w-0 text-left text-sm'
                          }
                          onClick={() => {
                            setEditingChecklistItemId(item.id)
                            setEditingChecklistItemText(item.text)
                          }}
                        >
                          {item.text}
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${item.text}`}
                      onClick={() =>
                        setChecklistItems((current) =>
                          current.filter(
                            (currentItem) => currentItem.id !== item.id,
                          ),
                        )
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={handleAddChecklistItem}
              >
                <Input
                  value={checklistText}
                  onChange={(event) => setChecklistText(event.target.value)}
                  placeholder="Add an item"
                />
                <Button type="submit" disabled={!checklistText.trim()}>
                  Add
                </Button>
              </form>
            </section>

            {assignedMembers.length > 0 && (
              <section className="mt-8 pl-9">
                <div className="flex items-center gap-3">
                  <Users
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Members</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedMembers.map((member) => (
                    <Badge
                      key={member}
                      className="gap-1 border-white/55 bg-white/55 text-foreground shadow-sm backdrop-blur-xl"
                    >
                      {member}
                      <button
                        type="button"
                        className="rounded-full text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${member}`}
                        onClick={() => handleToggleAssignedMember(member)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {attachments.length > 0 && (
              <section ref={attachmentsRef} className="mt-8 pl-9">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Paperclip
                      aria-hidden="true"
                      className="size-5 text-muted-foreground"
                    />
                    <h3 className="text-base font-semibold">Attachments</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-lg border bg-background/70 p-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Paperclip aria-hidden="true" className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {editingAttachmentId === attachment.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={editingAttachmentName}
                              onChange={(event) =>
                                setEditingAttachmentName(event.target.value)
                              }
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  handleSaveAttachmentName(attachment.id)
                                }
                                disabled={!editingAttachmentName.trim()}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingAttachmentId(null)
                                  setEditingAttachmentName('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="truncate text-sm font-medium">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Open ${attachment.name}`}
                        onClick={() =>
                          window.open(attachment.url, '_blank', 'noopener')
                        }
                      >
                        <ExternalLink aria-hidden="true" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`${attachment.name} options`}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={() =>
                              window.open(attachment.url, '_blank', 'noopener')
                            }
                          >
                            <ExternalLink aria-hidden="true" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingAttachmentId(attachment.id)
                              setEditingAttachmentName(attachment.name)
                            }}
                          >
                            <Edit3 aria-hidden="true" />
                            Edit name
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleDownloadAttachment(attachment)
                            }
                          >
                            <Download aria-hidden="true" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                              handleDeleteAttachment(attachment.id)
                            }
                          >
                            <Trash2 aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>

          <aside className="min-h-0 overflow-y-auto border-t bg-muted/35 px-4 py-5 md:border-t-0 md:border-l">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <h3 className="font-semibold">Comments and activity</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails((current) => !current)}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </Button>
            </div>

            {showDetails && (
              <div className="mt-4 rounded-lg border bg-background/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {card.completed ? 'Complete' : 'Open'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">{comments.length}</span>
                </div>
              </div>
            )}

            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => void handleAddComment(event)}
            >
              <Input
                className="bg-background"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <Button
                type="submit"
                disabled={
                  !commentText.trim() || createCommentMutation.isPending
                }
              >
                {createCommentMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </form>

            <div className="mt-4 flex items-start gap-3 rounded-lg bg-background/60 p-3">
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

            <div className="mt-3 flex flex-col gap-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 rounded-lg bg-background/70 p-3"
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {getInitials(comment.authorName) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{comment.authorName}</p>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit comment"
                          onClick={() => {
                            setEditingCommentId(comment.id)
                            setEditingCommentText(comment.body)
                          }}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remove comment"
                          onClick={() => void handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(event) =>
                            setEditingCommentText(event.target.value)
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSaveComment(comment.id)}
                            disabled={
                              !editingCommentText.trim() ||
                              updateCommentMutation.isPending
                            }
                          >
                            {updateCommentMutation.isPending
                              ? 'Saving...'
                              : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditingCommentText('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap break-words">
                        {comment.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(comment.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
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
