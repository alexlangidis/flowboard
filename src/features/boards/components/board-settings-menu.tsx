import {
  ChevronsDownUp,
  ChevronsUpDown,
  Palette,
  Pencil,
  RefreshCw,
  Settings,
  Star,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { DeleteBoardDialog } from '@/features/boards/components/delete-board-dialog'
import { EditBoardDialog } from '@/features/boards/components/edit-board-dialog'
import { boardThemes } from '@/features/boards/lib/board-style'
import type { BoardDetail } from '@/features/boards/types'

import { BoardMenuStat } from './board-menu-stat'

export function BoardSettingsMenu({
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
