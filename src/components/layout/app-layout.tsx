import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  LayoutGrid,
  Plus,
  Settings,
  UserRound,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
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
import {
  useCreateWorkspaceMutation,
  useWorkspacesQuery,
} from '@/features/workspaces/hooks/use-workspaces'
import { useUiStore } from '@/stores/ui-store'

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
  const isResolvingAppUser =
    isAppRoute &&
    (currentUserQuery.isPending || currentUserQuery.isFetching) &&
    !currentUserQuery.isError
  const showAppHeader = isAppRoute && (Boolean(currentUser) || isResolvingAppUser)
  const useFullWidthAppLayout =
    isFullWidthApp && (Boolean(currentUser) || isResolvingAppUser)
  const workspacesQuery = useWorkspacesQuery(showAppHeader)
  const workspaces = workspacesQuery.data?.data.workspaces ?? []
  const activeWorkspaceId = useUiStore((state) => state.activeWorkspaceId)
  const setActiveWorkspaceId = useUiStore((state) => state.setActiveWorkspaceId)
  const workspace =
    workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0]
  const createWorkspaceMutation = useCreateWorkspaceMutation()
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
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

  async function handleAddWorkspace() {
    if (!newWorkspaceName.trim()) {
      return
    }

    try {
      const response = await createWorkspaceMutation.mutateAsync({
        name: newWorkspaceName.trim(),
      })

      setActiveWorkspaceId(response.data.workspace.id)
      setNewWorkspaceName('')
      toast.success('Workspace added.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add workspace.',
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-1 hidden max-w-56 gap-1 md:inline-flex"
                >
                  <span className="truncate">
                    {workspace?.name ?? 'Workspace'}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                {workspaces.length > 0 ? (
                  workspaces.map((workspaceItem) => (
                    <DropdownMenuItem
                      key={workspaceItem.id}
                      onSelect={() => setActiveWorkspaceId(workspaceItem.id)}
                    >
                      <Building2 aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        {workspaceItem.name}
                      </span>
                      {workspace?.id === workspaceItem.id && (
                        <Check aria-hidden="true" className="ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    No workspaces found
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <div
                  className="space-y-2 p-2"
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="topbar-new-workspace"
                  >
                    Add workspace
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="topbar-new-workspace"
                      value={newWorkspaceName}
                      onChange={(event) =>
                        setNewWorkspaceName(event.target.value)
                      }
                      placeholder="Workspace name"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        createWorkspaceMutation.isPending ||
                        !newWorkspaceName.trim()
                      }
                      onClick={() => void handleAddWorkspace()}
                    >
                      <Plus aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <AppSearch />

            {canCreateBoard ? (
              <CreateBoardDialog workspaceId={workspace?.id}>
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
          useFullWidthAppLayout
            ? 'h-[calc(100svh-3.5rem)] bg-muted/30'
            : 'mx-auto max-w-7xl px-4'
        }
      >
        {children}
      </main>
    </div>
  )
}
