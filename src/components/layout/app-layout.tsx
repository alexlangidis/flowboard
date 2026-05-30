import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  Plus,
  Settings,
  UserRound,
} from 'lucide-react'
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
import { getCurrentUser } from '@/features/auth/api/auth-api'
import { useLogoutMutation } from '@/features/auth/hooks/use-auth-mutations'
import { CreateBoardDialog } from '@/features/boards/components/create-board-dialog'
import { useWorkspacesQuery } from '@/features/workspaces/hooks/use-workspaces'

import { AppSearch } from './app-search'

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isWorkspaceRoute =
    pathname === '/dashboard' ||
    pathname === '/favorites' ||
    pathname === '/members' ||
    pathname === '/recent'
  const isAccountRoute = pathname === '/profile' || pathname === '/settings'
  const isFullWidthApp =
    pathname.startsWith('/boards/') || isWorkspaceRoute || isAccountRoute
  const canCreateBoard =
    pathname.startsWith('/boards/') ||
    pathname === '/dashboard' ||
    pathname === '/favorites' ||
    pathname === '/recent'
  const isAppRoute =
    pathname.startsWith('/boards/') || isWorkspaceRoute || isAccountRoute
  const logoutMutation = useLogoutMutation()
  const currentUserQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: isAppRoute,
  })
  const currentUser = currentUserQuery.data?.data.user
  const showAppHeader = isAppRoute && Boolean(currentUser)
  const workspacesQuery = useWorkspacesQuery(showAppHeader)
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
      {showAppHeader && (
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

            <AppSearch />

            {canCreateBoard ? (
              <CreateBoardDialog>
                <Button size="sm" className="ml-auto shadow-sm md:ml-0">
                  <Plus data-icon="inline-start" />
                  Create
                </Button>
              </CreateBoardDialog>
            ) : (
              <div className="ml-auto md:hidden" />
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
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserRound data-icon="inline-start" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings data-icon="inline-start" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
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
      )}
      <main
        className={
          isFullWidthApp && showAppHeader
            ? 'h-[calc(100svh-3.5rem)] bg-muted/30'
            : 'mx-auto max-w-7xl px-4'
        }
      >
        {children}
      </main>
    </div>
  )
}
