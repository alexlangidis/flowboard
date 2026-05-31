import { AlignLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function CardDetailDescription({
  description,
  isEditing,
  isPending,
  onCancel,
  onChange,
  onEdit,
  onSave,
}: {
  description: string
  isEditing: boolean
  isPending: boolean
  onCancel: () => void
  onChange: (description: string) => void
  onEdit: () => void
  onSave: () => void
}) {
  return (
    <section className="mt-8 pl-9">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlignLeft aria-hidden="true" className="size-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Description</h3>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-3">
          <Textarea
            value={description}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Add a description..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-muted/40 p-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {description || 'No description yet.'}
          </p>
        </div>
      )}
    </section>
  )
}
