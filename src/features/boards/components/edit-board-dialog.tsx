import { useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent, ReactNode } from 'react'

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useUpdateBoardMutation } from '../hooks/use-boards'
import type { Board } from '../types'

type EditBoardDialogProps = {
  board: Board
  children: ReactNode
}

export function EditBoardDialog({ board, children }: EditBoardDialogProps) {
  const updateBoardMutation = useUpdateBoardMutation(board.id)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(board.name)
  const [description, setDescription] = useState(board.description ?? '')
  const [nameError, setNameError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setNameError('Board name is required.')
      return
    }

    setNameError(null)

    try {
      await updateBoardMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
      })
      setOpen(false)
      toast.success('Board updated.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update board.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit board</DialogTitle>
          <DialogDescription>
            Update this board name and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor={`board-name-${board.id}`}>
                Board name
              </FieldLabel>
              <Input
                id={`board-name-${board.id}`}
                value={name}
                aria-invalid={Boolean(nameError)}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldError>{nameError}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`board-description-${board.id}`}>
                Description
              </FieldLabel>
              <Textarea
                id={`board-description-${board.id}`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <FieldDescription>
                Optional, shown on your dashboard.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-5">
            <Button type="submit" disabled={updateBoardMutation.isPending}>
              {updateBoardMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
