import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  CalendarDays,
  LayoutGrid,
  PanelTop,
  Pencil,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import {
  AddListForm,
  BoardListSection,
} from '@/features/boards/components/board-list-section'
import { CardShell } from '@/features/boards/components/board-card-shell'
import { BoardSettingsMenu } from '@/features/boards/components/board-settings-menu'
import { DeleteBoardDialog } from '@/features/boards/components/delete-board-dialog'
import { EditBoardDialog } from '@/features/boards/components/edit-board-dialog'
import {
  useBoardQuery,
  useMoveCardMutation,
  useMoveListMutation,
  useToggleBoardStarMutation,
} from '@/features/boards/hooks/use-boards'
import {
  boardThemes,
  listColors,
  listIcons,
} from '@/features/boards/lib/board-style'
import {
  findCard,
  getDropTarget,
} from '@/features/boards/lib/board-route-utils'
import type {
  CardColor,
  ListColor,
  ListIcon,
} from '@/features/boards/lib/board-style'
import type { Board, BoardCard } from '@/features/boards/types'

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
                onSetCardColor={handleSetCardColor}
                onSetListColor={handleSetListColor}
                onSetListIcon={handleSetListIcon}
                onMoveList={handleMoveList}
                onToggleCollapsed={() => handleToggleList(list.id)}
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
