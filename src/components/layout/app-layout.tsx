import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, ChevronDown, LayoutGrid, Plus, Search } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import { useLogoutMutation } from '@/features/auth/hooks/use-auth-mutations'
import { CreateBoardDialog } from '@/features/boards/components/create-board-dialog'
import { useWorkspacesQuery } from '@/features/workspaces/hooks/use-workspaces'

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isFullWidthApp =
    pathname.startsWith('/boards/') || pathname === '/dashboard'
  const canCreateBoard =
    pathname.startsWith('/boards/') || pathname === '/dashboard'
  const isAppRoute = canCreateBoard
  const logoutMutation = useLogoutMutation()
  const currentUserQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: isAppRoute,
  })
  const workspacesQuery = useWorkspacesQuery(isAppRoute)
  const currentUser = currentUserQuery.data?.data.user
  const workspace = workspacesQuery.data?.data.workspaces[0]
  const initials =
    currentUser?.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'FB'

  async function handleSignOut() {
    try {
      await logoutMutation.mutateAsync()
      queryClient.clear()
      toast.success('Signed out.')
      await navigate({ to: '/login' })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to sign out.',
      )
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LayoutGrid aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              FlowBoard
            </span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            className="ml-1 hidden max-w-48 gap-1 md:inline-flex"
          >
            <span className="truncate">{workspace?.name ?? 'Workspace'}</span>
            <ChevronDown aria-hidden="true" />
          </Button>

          <div className="relative ml-auto hidden w-full max-w-md md:block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="h-8 rounded-lg border-border/70 bg-muted/40 pl-8"
              placeholder="Search boards and cards"
            />
          </div>

          {canCreateBoard ? (
            <CreateBoardDialog>
              <Button size="sm" className="ml-auto shadow-sm md:ml-0">
                <Plus data-icon="inline-start" />
                Create
              </Button>
            </CreateBoardDialog>
          ) : (
            <Button size="sm" className="ml-auto shadow-sm md:ml-0" asChild>
              <Link to="/login">
                <Plus data-icon="inline-start" />
                Create
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Notifications"
          >
            <Bell aria-hidden="true" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open user menu">
                <Avatar size="sm">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block truncate">
                  {currentUser?.name ?? 'Account'}
                </span>
                {currentUser?.email && (
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {currentUser.email}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void handleSignOut()}
                onSelect={(event) => {
                  event.preventDefault()
                  void handleSignOut()
                }}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main
        className={
          isFullWidthApp
            ? 'h-[calc(100svh-3.5rem)] bg-muted/30'
            : 'mx-auto max-w-7xl px-4'
        }
      >
        {children}
      </main>
    </div>
  )
}
