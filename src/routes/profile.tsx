import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Mail, UserRound } from 'lucide-react'

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

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuthenticatedUser,
  component: ProfilePage,
})

function ProfilePage() {
  const currentUserQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
  })
  const boardsQuery = useBoardsQuery()
  const workspacesQuery = useWorkspacesQuery()
  const currentUser = currentUserQuery.data?.data.user
  const boards = boardsQuery.data?.data.boards ?? []
  const workspace = workspacesQuery.data?.data.workspaces[0]
  const workspaceName =
    workspace?.name ?? boards[0]?.workspaceName ?? 'Workspace'
  const initials =
    currentUser?.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'FB'

  return (
    <WorkspaceShell boards={boards} workspaceName={workspaceName}>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border bg-background p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserRound aria-hidden="true" className="size-4" />
                  <span>{workspaceName}</span>
                </div>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                  Profile
                </h1>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {currentUser?.name ?? 'Account'} ·{' '}
                  {currentUser?.email ?? 'No email available'}
                </p>
              </div>
            </div>
            <Badge className="w-fit" variant="secondary">
              Neon Auth
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-background shadow-sm">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Details provided by the active Neon Auth session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InfoRow
                icon={UserRound}
                label="Name"
                value={currentUser?.name ?? 'Not available'}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={currentUser?.email ?? 'Not available'}
              />
            </CardContent>
          </Card>

          <Card className="bg-background shadow-sm">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                Current workspace summary for this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InfoRow
                icon={UserRound}
                label="Workspace"
                value={workspace?.name ?? 'Workspace'}
              />
              <InfoRow
                icon={Calendar}
                label="Boards"
                value={`${boards.length} ${
                  boards.length === 1 ? 'board' : 'boards'
                }`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
        <span>{label}</span>
      </div>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  )
}
