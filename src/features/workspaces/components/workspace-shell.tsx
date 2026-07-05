import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Clock, LayoutDashboard, Star, Users } from 'lucide-react'
import type { PropsWithChildren } from 'react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Board } from '@/features/boards/types'
import { getBoardAccentClass } from '@/lib/board-colors'
import { cn } from '@/lib/utils'

export type WorkspaceNavItem = 'boards' | 'favorites' | 'members' | 'recent'

const workspaceLinks: Array<{
  key: WorkspaceNavItem
  label: string
  to: '/dashboard' | '/favorites' | '/members' | '/recent'
  icon: LucideIcon
  swatchClass: string
}> = [
  {
    key: 'boards',
    label: 'Boards',
    to: '/dashboard',
    icon: LayoutDashboard,
    swatchClass: 'bg-flow-blue',
  },
  {
    key: 'favorites',
    label: 'Favorites',
    to: '/favorites',
    icon: Star,
    swatchClass: 'bg-flow-yellow',
  },
  {
    key: 'members',
    label: 'Members',
    to: '/members',
    icon: Users,
    swatchClass: 'bg-flow-purple',
  },
  {
    key: 'recent',
    label: 'Recent',
    to: '/recent',
    icon: Clock,
    swatchClass: 'bg-flow-cyan',
  },
]

export function WorkspaceShell({
  activeItem,
  boards,
  children,
  workspaceName,
}: PropsWithChildren<{
  activeItem?: WorkspaceNavItem
  boards: Board[]
  workspaceName: string
}>) {
  const favoriteBoards = boards.filter((board) => board.isStarred)
  const workspaceInitials = workspaceName.slice(0, 2).toUpperCase()

  return (
    <div className="grid h-full gap-0 overflow-hidden md:grid-cols-[17rem_1fr]">
      <aside className="hidden overflow-y-auto border-r bg-background px-3 py-5 md:block">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
            {workspaceInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{workspaceName}</p>
            <p className="text-xs text-muted-foreground">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
            </p>
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-1">
          {workspaceLinks.map((item) => {
            const isActive = activeItem === item.key

            return (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  'flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-border bg-muted font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('size-2 shrink-0 rounded-sm', item.swatchClass)}
                />
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator className="my-5" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Pinned
            </p>
            <Badge variant="secondary">{favoriteBoards.length}</Badge>
          </div>
          {favoriteBoards.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {favoriteBoards.slice(0, 5).map((board) => (
                <Link
                  key={board.id}
                  to="/boards/$boardId"
                  params={{ boardId: board.id }}
                  className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 shrink-0 rounded-sm',
                      getBoardAccentClass(board.id),
                    )}
                  />
                  <span className="truncate">{board.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-1 text-sm leading-6 text-muted-foreground">
              Star boards to keep your most important work close.
            </p>
          )}
        </div>
      </aside>

      <section className="min-w-0 overflow-y-auto bg-muted/20 px-4 py-5 md:px-8 md:py-7">
        {children}
      </section>
    </div>
  )
}
