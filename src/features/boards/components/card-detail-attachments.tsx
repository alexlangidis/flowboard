import {
  Download,
  Edit3,
  ExternalLink,
  MoreHorizontal,
  Paperclip,
  Trash2,
} from 'lucide-react'
import type { RefObject } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { formatFileSize } from '@/features/boards/components/card-detail-utils'
import type { CardAttachmentItem } from '@/features/boards/lib/board-style'

export function CardDetailAttachments({
  attachments,
  editingAttachmentId,
  editingAttachmentName,
  isUploading,
  onDelete,
  onDownload,
  onEditingNameChange,
  onOpen,
  onPickFiles,
  onSaveName,
  onStartEdit,
  onStopEdit,
  sectionRef,
}: {
  attachments: CardAttachmentItem[]
  editingAttachmentId: string | null
  editingAttachmentName: string
  isUploading: boolean
  onDelete: (attachmentId: string) => void
  onDownload: (attachment: CardAttachmentItem) => void
  onEditingNameChange: (name: string) => void
  onOpen: (attachment: CardAttachmentItem) => void
  onPickFiles: () => void
  onSaveName: (attachmentId: string) => void
  onStartEdit: (attachment: CardAttachmentItem) => void
  onStopEdit: () => void
  sectionRef: RefObject<HTMLDivElement | null>
}) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <section ref={sectionRef} className="mt-8 pl-9">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Paperclip aria-hidden="true" className="size-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Attachments</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={onPickFiles}
        >
          {isUploading ? 'Uploading...' : 'Add'}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 rounded-lg border bg-background/70 p-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Paperclip aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              {editingAttachmentId === attachment.id ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={editingAttachmentName}
                    onChange={(event) => onEditingNameChange(event.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onSaveName(attachment.id)}
                      disabled={!editingAttachmentName.trim()}
                    >
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onStopEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="truncate text-sm font-medium">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Open ${attachment.name}`}
              onClick={() => onOpen(attachment)}
            >
              <ExternalLink aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${attachment.name} options`}
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onOpen(attachment)}>
                  <ExternalLink aria-hidden="true" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onStartEdit(attachment)}>
                  <Edit3 aria-hidden="true" />
                  Edit name
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDownload(attachment)}>
                  <Download aria-hidden="true" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(attachment.id)}
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </section>
  )
}
