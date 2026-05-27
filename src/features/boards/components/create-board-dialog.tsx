import { useNavigate } from '@tanstack/react-router'
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

import { useCreateBoardMutation } from '../hooks/use-boards'

type CreateBoardDialogProps = {
  children: ReactNode
}

export function CreateBoardDialog({ children }: CreateBoardDialogProps) {
  const navigate = useNavigate()
  const createBoardMutation = useCreateBoardMutation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setNameError('Board name is required.')
      return
    }

    setNameError(null)

    try {
      const response = await createBoardMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })

      setOpen(false)
      setName('')
      setDescription('')
      toast.success('Board created.')
      await navigate({
        to: '/boards/$boardId',
        params: { boardId: response.data.board.id },
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create board.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
          <DialogDescription>
            Add a new board to your workspace. Lists and cards can be added
            next.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="board-name">Board name</FieldLabel>
              <Input
                id="board-name"
                value={name}
                aria-invalid={Boolean(nameError)}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product launch"
              />
              <FieldError>{nameError}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="board-description">Description</FieldLabel>
              <Textarea
                id="board-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this board for?"
              />
              <FieldDescription>
                Optional, shown on your dashboard.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-5">
            <Button type="submit" disabled={createBoardMutation.isPending}>
              {createBoardMutation.isPending ? 'Creating...' : 'Create board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
