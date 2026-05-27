import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { useDeleteBoardMutation } from '../hooks/use-boards'
import type { Board } from '../types'

type DeleteBoardDialogProps = {
  board: Board
  children: ReactNode
  navigateToDashboard?: boolean
}

export function DeleteBoardDialog({
  board,
  children,
  navigateToDashboard = false,
}: DeleteBoardDialogProps) {
  const navigate = useNavigate()
  const deleteBoardMutation = useDeleteBoardMutation()

  async function handleDelete() {
    try {
      await deleteBoardMutation.mutateAsync(board.id)
      toast.success('Board deleted.')

      if (navigateToDashboard) {
        await navigate({ to: '/dashboard' })
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete board.',
      )
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete board</DialogTitle>
          <DialogDescription>
            Delete "{board.name}" and all lists and cards inside it. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleteBoardMutation.isPending}
          >
            {deleteBoardMutation.isPending ? 'Deleting...' : 'Delete board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
