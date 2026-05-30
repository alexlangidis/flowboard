import { createFileRoute } from '@tanstack/react-router'
import { Mail, ShieldCheck, UserRound, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import { requireAuthenticatedUser } from '@/features/auth/api/route-guards'
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'
import { WorkspaceShell } from '@/features/workspaces/components/workspace-shell'
import { useWorkspacesQuery } from '@/features/workspaces/hooks/use-workspaces'

export const Route = createFileRoute('/members')({
  beforeLoad: requireAuthenticatedUser,
  component: MembersPage,
})

function MembersPage() {
  const currentUserQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
  })
  const boardsQuery = useBoardsQuery()
  const workspacesQuery = useWorkspacesQuery()
  const boards = boardsQuery.data?.data.boards ?? []
  const workspace = workspacesQuery.data?.data.workspaces[0]
  const workspaceName =
    workspace?.name ?? boards[0]?.workspaceName ?? 'Workspace'
  const currentUser = currentUserQuery.data?.data.user
  const initials =
    currentUser?.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'FB'

  return (
    <WorkspaceShell
      activeItem="members"
      boards={boards}
      workspaceName={workspaceName}
    >
      <div className="rounded-2xl border bg-background p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users aria-hidden="true" className="size-4" />
          <span>{workspaceName}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Members
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Workspace access and member roles.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="bg-background shadow-sm">
          <CardHeader>
            <CardTitle>Workspace members</CardTitle>
            <CardDescription>
              Collaboration invites are not enabled yet, so this workspace only
              lists the signed-in owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {currentUser?.name ?? 'Account'}
                  </p>
                  <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                    <Mail aria-hidden="true" className="size-4 shrink-0" />
                    <span className="truncate">
                      {currentUser?.email ?? 'No email'}
                    </span>
                  </div>
                </div>
              </div>
              <Badge className="w-fit">
                <ShieldCheck data-icon="inline-start" />
                {workspace?.role ?? 'Owner'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-sm">
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>
              Current workspace membership status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Members</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Workspace boards</span>
              <span className="font-medium">{boards.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Invite support</span>
              <Badge variant="secondary">
                <UserRound data-icon="inline-start" />
                Later
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  )
}
