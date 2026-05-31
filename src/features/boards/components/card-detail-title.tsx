import { DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Square, SquareCheckBig } from 'lucide-react'

export function CardDetailTitle({
  boardId,
  completed,
  isEditing,
  isPending,
  onCancel,
  onEdit,
  onSave,
  onTitleChange,
  onToggleCompleted,
  title,
  titleError,
}: {
  boardId?: string
  completed: boolean
  isEditing: boolean
  isPending: boolean
  onCancel: () => void
  onEdit: () => void
  onSave: () => void
  onTitleChange: (title: string) => void
  onToggleCompleted: () => void
  title: string
  titleError: string | null
}) {
  return (
    <div
      className={
        isEditing
          ? 'grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3'
          : 'grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3'
      }
    >
      <button
        type="button"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={completed ? `Mark ${title} incomplete` : `Mark ${title} complete`}
        title={completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={onToggleCompleted}
        disabled={!boardId || isPending}
      >
        {completed ? (
          <SquareCheckBig aria-hidden="true" className="size-5 text-emerald-600" />
        ) : (
          <Square aria-hidden="true" className="size-5" />
        )}
      </button>

      {isEditing ? (
        <div className="min-w-0 overflow-hidden">
          <Textarea
            value={title}
            aria-invalid={Boolean(titleError)}
            onChange={(event) => onTitleChange(event.target.value)}
            className="min-h-10 w-full resize-none rounded-md border-transparent bg-muted/35 px-2 py-1 text-2xl leading-tight font-semibold tracking-tight shadow-none [field-sizing:content] focus-visible:border-transparent focus-visible:ring-0"
            rows={1}
            autoFocus
          />
          {titleError && (
            <p className="mt-2 text-sm text-destructive">{titleError}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <DialogTitle
            className="min-w-0 break-words text-3xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]"
            title={boardId ? 'Double-click to edit title' : undefined}
            onDoubleClick={onEdit}
          >
            {title}
          </DialogTitle>
          {boardId && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Edit card title"
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
