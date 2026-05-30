import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Clock, LayoutDashboard, Star, Users } from 'lucide-react'
import type { PropsWithChildren } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Board } from '@/features/boards/types'
import { cn } from '@/lib/utils'

export type WorkspaceNavItem = 'boards' | 'favorites' | 'members' | 'recent'

const workspaceLinks: Array<{
  key: WorkspaceNavItem
  label: string
  to: '/dashboard' | '/favorites' | '/members' | '/recent'
  icon: LucideIcon
}> = [
  { key: 'boards', label: 'Boards', to: '/dashboard', icon: LayoutDashboard },
  { key: 'favorites', label: 'Favorites', to: '/favorites', icon: Star },
  { key: 'members', label: 'Members', to: '/members', icon: Users },
  { key: 'recent', label: 'Recent', to: '/recent', icon: Clock },
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

  return (
    <div className="grid h-full gap-0 overflow-hidden md:grid-cols-[17rem_1fr]">
      <aside className="hidden overflow-y-auto border-r bg-background px-4 py-5 md:block">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
          <Avatar className="size-10 rounded-lg">
            <AvatarFallback className="rounded-lg">
              {workspaceName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{workspaceName}</p>
            <p className="text-xs text-muted-foreground">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
            </p>
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-1">
          {workspaceLinks.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                activeItem === item.key
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <item.icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-5" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Favorites
            </p>
            <Badge variant="secondary">{favoriteBoards.length}</Badge>
          </div>
          {favoriteBoards.length > 0 ? (
            <div className="flex flex-col gap-1">
              {favoriteBoards.slice(0, 5).map((board) => (
                <Link
                  key={board.id}
                  to="/boards/$boardId"
                  params={{ boardId: board.id }}
                  className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Star aria-hidden="true" className="size-4 fill-current" />
                  <span className="truncate">{board.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Star boards to keep your most important work close.
            </p>
          )}
        </div>
      </aside>

      <section className="min-w-0 overflow-y-auto bg-muted/30 px-4 py-5 md:px-8 md:py-7">
        {children}
      </section>
    </div>
  )
}
