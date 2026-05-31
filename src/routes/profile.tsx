import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Building2,
  Calendar,
  Mail,
  Plus,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import {
  currentUserQueryKey,
  useUpdateCurrentUserMutation,
} from '@/features/auth/hooks/use-auth-mutations'
import { requireAuthenticatedUser } from '@/features/auth/api/route-guards'
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'
import { WorkspaceShell } from '@/features/workspaces/components/workspace-shell'
import { useActiveWorkspace } from '@/features/workspaces/hooks/use-active-workspace'
import {
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useWorkspacesQuery,
} from '@/features/workspaces/hooks/use-workspaces'
import type { Workspace } from '@/features/workspaces/types'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuthenticatedUser,
  component: ProfilePage,
})

function ProfilePage() {
  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  })
  const boardsQuery = useBoardsQuery()
  const workspacesQuery = useWorkspacesQuery()
  const updateCurrentUserMutation = useUpdateCurrentUserMutation()
  const createWorkspaceMutation = useCreateWorkspaceMutation()
  const updateWorkspaceMutation = useUpdateWorkspaceMutation()
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation()
  const currentUser = currentUserQuery.data?.data.user
  const boards = boardsQuery.data?.data.boards ?? []
  const workspaces = workspacesQuery.data?.data.workspaces ?? []
  const { setActiveWorkspaceId, workspaceBoards, workspaceName } =
    useActiveWorkspace(boards)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const initials =
    currentUser?.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'FB'

  async function handleUpdateName(name: string) {
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }

    try {
      await updateCurrentUserMutation.mutateAsync({ name: name.trim() })
      toast.success('Name updated.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update name.',
      )
    }
  }

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newWorkspaceName.trim()) {
      toast.error('Workspace name is required.')
      return
    }

    try {
      await createWorkspaceMutation.mutateAsync({
        name: newWorkspaceName.trim(),
      })
      setNewWorkspaceName('')
      toast.success('Workspace added.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add workspace.',
      )
    }
  }

  async function handleUpdateWorkspace(workspaceId: string, nextName: string) {
    if (!nextName.trim()) {
      toast.error('Workspace name is required.')
      return
    }

    try {
      await updateWorkspaceMutation.mutateAsync({
        workspaceId,
        input: { name: nextName.trim() },
      })
      toast.success('Workspace updated.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update workspace.',
      )
    }
  }

  async function handleDeleteWorkspace(workspaceId: string, name: string) {
    if (workspaces.length <= 1) {
      toast.error('Create another workspace before deleting this one.')
      return
    }

    const confirmed = window.confirm(
      `Delete "${name}" and all boards inside it? This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteWorkspaceMutation.mutateAsync(workspaceId)
      const nextWorkspace = workspaces.find(
        (workspace) => workspace.id !== workspaceId,
      )

      setActiveWorkspaceId(nextWorkspace?.id ?? null)
      toast.success('Workspace deleted.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete workspace.',
      )
    }
  }

  return (
    <WorkspaceShell boards={workspaceBoards} workspaceName={workspaceName}>
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-background shadow-sm">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Update the profile details shown across FlowBoard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ProfileNameForm
                key={currentUser?.name ?? 'profile-name'}
                initialName={currentUser?.name ?? ''}
                isSaving={updateCurrentUserMutation.isPending}
                onSave={handleUpdateName}
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
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>
                Rename existing workspaces or add another workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                {workspaces.map((workspaceItem) => (
                  <WorkspaceNameForm
                    key={`${workspaceItem.id}:${workspaceItem.name}`}
                    workspace={workspaceItem}
                    canDelete={workspaces.length > 1}
                    isDeleting={deleteWorkspaceMutation.isPending}
                    isSaving={updateWorkspaceMutation.isPending}
                    onDelete={handleDeleteWorkspace}
                    onSave={handleUpdateWorkspace}
                  />
                ))}
              </div>
              <form
                className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3 sm:flex-row"
                onSubmit={handleCreateWorkspace}
              >
                <Input
                  value={newWorkspaceName}
                  onChange={(event) => setNewWorkspaceName(event.target.value)}
                  placeholder="New workspace name"
                />
                <Button
                  type="submit"
                  disabled={
                    createWorkspaceMutation.isPending ||
                    !newWorkspaceName.trim()
                  }
                >
                  <Plus data-icon="inline-start" />
                  {createWorkspaceMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </form>
              <InfoRow
                icon={Calendar}
                label="Boards"
                value={`${workspaceBoards.length} ${
                  workspaceBoards.length === 1 ? 'board' : 'boards'
                }`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  )
}

function ProfileNameForm({
  initialName,
  isSaving,
  onSave,
}: {
  initialName: string
  isSaving: boolean
  onSave: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(initialName)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(name)
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <label className="text-sm font-medium" htmlFor="profile-name">
        Name
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
        />
        <Button type="submit" disabled={isSaving || !name.trim()}>
          <Save data-icon="inline-start" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function WorkspaceNameForm({
  canDelete,
  isDeleting,
  isSaving,
  onDelete,
  onSave,
  workspace,
}: {
  canDelete: boolean
  isDeleting: boolean
  isSaving: boolean
  onDelete: (workspaceId: string, name: string) => Promise<void>
  onSave: (workspaceId: string, name: string) => Promise<void>
  workspace: Workspace
}) {
  const [name, setName] = useState(workspace.name)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(workspace.id, name)
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 aria-hidden="true" className="size-4" />
        <span className="text-sm">{workspace.role}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Workspace name"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="outline" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-300/70 bg-red-500/10 text-red-700 hover:bg-red-500/15 hover:text-red-800 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300"
            disabled={!canDelete || isDeleting || workspace.role !== 'owner'}
            onClick={() => void onDelete(workspace.id, workspace.name)}
          >
            <Trash2 data-icon="inline-start" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </form>
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
