import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Bell, Database, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireAuthenticatedUser } from '@/features/auth/api/route-guards'
import { useLogoutMutation } from '@/features/auth/hooks/use-auth-mutations'
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'
import { WorkspaceShell } from '@/features/workspaces/components/workspace-shell'
import { useWorkspacesQuery } from '@/features/workspaces/hooks/use-workspaces'

export const Route = createFileRoute('/settings')({
  beforeLoad: requireAuthenticatedUser,
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logoutMutation = useLogoutMutation()
  const boardsQuery = useBoardsQuery()
  const workspacesQuery = useWorkspacesQuery()
  const boards = boardsQuery.data?.data.boards ?? []
  const workspace = workspacesQuery.data?.data.workspaces[0]
  const workspaceName =
    workspace?.name ?? boards[0]?.workspaceName ?? 'Workspace'

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
    <WorkspaceShell boards={boards} workspaceName={workspaceName}>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border bg-background p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings aria-hidden="true" className="size-4" />
            <span>{workspaceName}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Account, workspace, and app configuration summary.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-background shadow-sm">
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Sign-in and session handling are powered by Neon Auth.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SettingRow
                icon={ShieldCheck}
                label="Provider"
                value="Neon Auth"
              />
              <SettingRow
                icon={Database}
                label="Database"
                value="Neon Postgres"
              />
              <Button
                variant="outline"
                onClick={() => void handleSignOut()}
                disabled={logoutMutation.isPending}
              >
                <LogOut data-icon="inline-start" />
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-background shadow-sm">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                Current workspace details used by boards and cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SettingRow
                icon={Settings}
                label="Workspace"
                value={workspace?.name ?? 'Workspace'}
              />
              <SettingRow
                icon={Database}
                label="Boards"
                value={`${boards.length} ${
                  boards.length === 1 ? 'board' : 'boards'
                }`}
              />
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell aria-hidden="true" className="size-4" />
                  <span>Notifications</span>
                </div>
                <Badge variant="secondary">Default</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  )
}

function SettingRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Settings
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
        <span>{label}</span>
      </div>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  )
}
