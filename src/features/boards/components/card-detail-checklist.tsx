import { Check, CheckCircle2, Trash2 } from 'lucide-react'
import type { FormEvent, RefObject } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChecklistItem } from '@/features/boards/lib/board-style'

export function CardDetailChecklist({
  checklistProgress,
  completedCount,
  editingItemId,
  editingItemText,
  hideCheckedItems,
  items,
  onAddItem,
  onClearItems,
  onEditingItemTextChange,
  onHideCheckedItemsChange,
  onItemTextChange,
  onRemoveItem,
  onSaveItem,
  onStartEditItem,
  onStopEditItem,
  onToggleItem,
  sectionRef,
  text,
  visibleItems,
}: {
  checklistProgress: number
  completedCount: number
  editingItemId: string | null
  editingItemText: string
  hideCheckedItems: boolean
  items: ChecklistItem[]
  onAddItem: (event: FormEvent<HTMLFormElement>) => void
  onClearItems: () => void
  onEditingItemTextChange: (text: string) => void
  onHideCheckedItemsChange: () => void
  onItemTextChange: (text: string) => void
  onRemoveItem: (itemId: string) => void
  onSaveItem: (itemId: string) => void
  onStartEditItem: (item: ChecklistItem) => void
  onStopEditItem: () => void
  onToggleItem: (itemId: string) => void
  sectionRef: RefObject<HTMLDivElement | null>
  text: string
  visibleItems: ChecklistItem[]
}) {
  return (
    <section ref={sectionRef} className="mt-8 pl-9">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 aria-hidden="true" className="size-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Checklist</h3>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {completedCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onHideCheckedItemsChange}
            >
              {hideCheckedItems ? 'Show checked items' : 'Hide checked items'}
            </Button>
          )}
          {items.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={onClearItems}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="w-9 text-xs text-muted-foreground">
          {checklistProgress}%
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${checklistProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border bg-background/70 p-2"
          >
            <button
              type="button"
              className="mt-1 flex size-4 shrink-0 items-center justify-center rounded border border-input text-emerald-600"
              aria-label={
                item.completed
                  ? `Mark ${item.text} incomplete`
                  : `Mark ${item.text} complete`
              }
              onClick={() => onToggleItem(item.id)}
            >
              {item.completed && <Check aria-hidden="true" className="size-3" />}
            </button>
            <div className="min-w-0 flex-1">
              {editingItemId === item.id ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={editingItemText}
                    onChange={(event) =>
                      onEditingItemTextChange(event.target.value)
                    }
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onSaveItem(item.id)}
                      disabled={!editingItemText.trim()}
                    >
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onStopEditItem}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={
                    item.completed
                      ? 'min-w-0 text-left text-sm text-muted-foreground line-through'
                      : 'min-w-0 text-left text-sm'
                  }
                  onClick={() => onStartEditItem(item)}
                >
                  {item.text}
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${item.text}`}
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={onAddItem}>
        <Input
          value={text}
          onChange={(event) => onItemTextChange(event.target.value)}
          placeholder="Add an item"
        />
        <Button type="submit" disabled={!text.trim()}>
          Add
        </Button>
      </form>
    </section>
  )
}
