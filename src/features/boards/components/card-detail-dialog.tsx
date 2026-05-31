import {
  AlignLeft,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Square,
  SquareCheckBig,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent, RefObject } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import {
  useCreateCardCommentMutation,
  useDeleteCardCommentMutation,
  useUpdateCardCommentMutation,
  useUpdateCardMutation,
} from '@/features/boards/hooks/use-boards'
import type {
  CardAttachmentItem,
  CardColor,
  ChecklistItem,
} from '@/features/boards/lib/board-style'
import type { BoardCard } from '@/features/boards/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function CardDetailDialog({
  boardId,
  card,
  color,
  open,
  onOpenChange,
}: {
  boardId?: string
  card: BoardCard
  color: CardColor
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateCardMutation = useUpdateCardMutation(boardId ?? '')
  const createCommentMutation = useCreateCardCommentMutation(boardId ?? '')
  const updateCommentMutation = useUpdateCardCommentMutation(boardId ?? '')
  const deleteCommentMutation = useDeleteCardCommentMutation(boardId ?? '')
  const comments = card.comments ?? []
  const checklistRef = useRef<HTMLDivElement>(null)
  const attachmentsRef = useRef<HTMLDivElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<CardAttachmentItem[]>([])
  const [assignedMembers, setAssignedMembers] = useState<string[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checklistText, setChecklistText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [description, setDescription] = useState(card.description ?? '')
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(
    null,
  )
  const [editingAttachmentName, setEditingAttachmentName] = useState('')
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<
    string | null
  >(null)
  const [editingChecklistItemText, setEditingChecklistItemText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [hideCheckedItems, setHideCheckedItems] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [activityAuthor, setActivityAuthor] = useState({
    initials: 'U',
    name: 'You',
  })
  const checklistCompletedCount = checklistItems.filter(
    (item) => item.completed,
  ).length
  const checklistProgress =
    checklistItems.length === 0
      ? 0
      : Math.round((checklistCompletedCount / checklistItems.length) * 100)
  const availableMembers = ['Alex Langidis', 'Demo User']
  const filteredMembers = availableMembers.filter((member) =>
    member.toLowerCase().includes(memberSearch.trim().toLowerCase()),
  )
  const visibleChecklistItems = hideCheckedItems
    ? checklistItems.filter((item) => !item.completed)
    : checklistItems

  useEffect(() => {
    let ignore = false

    async function loadCurrentUser() {
      const response = await getCurrentUser()
      const user = response.data.user

      if (!ignore && user) {
        setActivityAuthor({
          initials: getInitials(user.name || user.email) || 'U',
          name: user.name || user.email,
        })
      }
    }

    void loadCurrentUser()

    return () => {
      ignore = true
    }
  }, [])

  function scrollToSection(ref: RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  async function handleSaveDescription() {
    if (!boardId) {
      return
    }

    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          description: description.trim() || null,
        },
      })
      setIsEditingDescription(false)
      toast.success('Description updated.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update description.',
      )
    }
  }

  function startEditingTitle() {
    if (!boardId) {
      return
    }

    setTitle(card.title)
    setTitleError(null)
    setIsEditingTitle(true)
  }

  async function handleSaveTitle() {
    if (!boardId) {
      return
    }

    if (!title.trim()) {
      setTitleError('Card title is required.')
      return
    }

    setTitleError(null)

    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          title: title.trim(),
        },
      })
      setIsEditingTitle(false)
      toast.success('Card title updated.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update title.',
      )
    }
  }

  async function handleToggleCompleted() {
    if (!boardId) {
      return
    }

    try {
      await updateCardMutation.mutateAsync({
        cardId: card.id,
        input: {
          completed: !card.completed,
        },
      })
      toast.success(card.completed ? 'Card reopened.' : 'Card completed.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update card.',
      )
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!boardId || !commentText.trim()) {
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        cardId: card.id,
        input: {
          body: commentText.trim(),
        },
      })
      setCommentText('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add comment.',
      )
    }
  }

  async function handleSaveComment(commentId: string) {
    if (!boardId || !editingCommentText.trim()) {
      return
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        input: {
          body: editingCommentText.trim(),
        },
      })
      setEditingCommentId(null)
      setEditingCommentText('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update comment.',
      )
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!boardId) {
      return
    }

    try {
      await deleteCommentMutation.mutateAsync(commentId)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete comment.',
      )
    }
  }

  function handleAddChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!checklistText.trim()) {
      return
    }

    setChecklistItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        completed: false,
        text: checklistText.trim(),
      },
    ])
    setChecklistText('')
  }

  function handleSaveChecklistItem(itemId: string) {
    if (!editingChecklistItemText.trim()) {
      return
    }

    setChecklistItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              text: editingChecklistItemText.trim(),
            }
          : item,
      ),
    )
    setEditingChecklistItemId(null)
    setEditingChecklistItemText('')
  }

  function handleToggleAssignedMember(member: string) {
    setAssignedMembers((current) =>
      current.includes(member)
        ? current.filter((currentMember) => currentMember !== member)
        : [...current, member],
    )
  }

  function handleAddAttachments(files: FileList | null) {
    if (!files?.length) {
      return
    }

    setAttachments((current) => [
      ...current,
      ...Array.from(files).map((file) => ({
        file,
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      })),
    ])

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  function handleSaveAttachmentName(attachmentId: string) {
    if (!editingAttachmentName.trim()) {
      return
    }

    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === attachmentId
          ? {
              ...attachment,
              name: editingAttachmentName.trim(),
            }
          : attachment,
      ),
    )
    setEditingAttachmentId(null)
    setEditingAttachmentName('')
  }

  function handleDeleteAttachment(attachmentId: string) {
    setAttachments((current) => {
      const attachment = current.find((item) => item.id === attachmentId)

      if (attachment) {
        URL.revokeObjectURL(attachment.url)
      }

      return current.filter((item) => item.id !== attachmentId)
    })
  }

  function handleDownloadAttachment(attachment: CardAttachmentItem) {
    const anchor = document.createElement('a')

    anchor.href = attachment.url
    anchor.download = attachment.name
    anchor.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-5xl"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4 pr-10">
            <Badge
              variant="outline"
              className={
                card.completed
                  ? 'border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'border-white/55 bg-white/50 text-muted-foreground'
              }
            >
              {card.completed ? 'Complete' : 'Open'}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-12 rounded-full ${color.bar}`} />
              {card.description && (
                <span className={`h-1.5 w-8 rounded-full ${color.mutedBar}`} />
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_28rem]">
          <section className="min-h-0 min-w-0 overflow-y-auto px-6 py-6">
            <div
              className={
                isEditingTitle
                  ? 'grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3'
                  : 'grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3'
              }
            >
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={
                  card.completed
                    ? `Mark ${card.title} incomplete`
                    : `Mark ${card.title} complete`
                }
                title={card.completed ? 'Mark incomplete' : 'Mark complete'}
                onClick={() => void handleToggleCompleted()}
                disabled={!boardId || updateCardMutation.isPending}
              >
                {card.completed ? (
                  <SquareCheckBig
                    aria-hidden="true"
                    className="size-5 text-emerald-600"
                  />
                ) : (
                  <Square aria-hidden="true" className="size-5" />
                )}
              </button>
              {isEditingTitle ? (
                <div className="min-w-0 overflow-hidden">
                  <Textarea
                    value={title}
                    aria-invalid={Boolean(titleError)}
                    onChange={(event) => setTitle(event.target.value)}
                    className="min-h-10 w-full resize-none rounded-md border-transparent bg-muted/35 px-2 py-1 text-2xl leading-tight font-semibold tracking-tight shadow-none [field-sizing:content] focus-visible:border-transparent focus-visible:ring-0"
                    rows={1}
                    autoFocus
                  />
                  {titleError && (
                    <p className="mt-2 text-sm text-destructive">
                      {titleError}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSaveTitle()}
                      disabled={updateCardMutation.isPending}
                    >
                      {updateCardMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTitle(card.title)
                        setTitleError(null)
                        setIsEditingTitle(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DialogTitle
                    className="min-w-0 break-words text-3xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]"
                    title={boardId ? 'Double-click to edit title' : undefined}
                    onDoubleClick={startEditingTitle}
                  >
                    {card.title}
                  </DialogTitle>
                  {boardId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit card title"
                      onClick={startEditingTitle}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pl-9">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(checklistRef)}
              >
                <CheckCircle2 aria-hidden="true" />
                Checklist
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant={membersPopoverOpen ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMembersPopoverOpen((current) => !current)}
                >
                  <Users aria-hidden="true" />
                  Members
                </Button>
                {membersPopoverOpen && (
                  <div
                    className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-80 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl"
                    onPointerDownCapture={(event) => event.stopPropagation()}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex-1 text-center text-sm font-semibold">
                        Members
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Close members"
                        onClick={() => setMembersPopoverOpen(false)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </div>
                    <Input
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder="Search members"
                      autoFocus
                    />
                    <p className="mt-4 mb-2 text-xs font-semibold text-muted-foreground">
                      Board members
                    </p>
                    <div className="flex flex-col gap-1">
                      {filteredMembers.map((member) => {
                        const isAssigned = assignedMembers.includes(member)

                        return (
                          <button
                            key={member}
                            type="button"
                            className={
                              isAssigned
                                ? 'flex items-center gap-2 rounded-md bg-muted px-2 py-2 text-left text-sm'
                                : 'flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted'
                            }
                            onClick={() => handleToggleAssignedMember(member)}
                          >
                            <Avatar
                              className={
                                member === 'Alex Langidis'
                                  ? 'size-8 bg-orange-500 text-white'
                                  : 'size-8'
                              }
                            >
                              <AvatarFallback>
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1 truncate">
                              {member}
                            </span>
                            {isAssigned && (
                              <Check
                                aria-hidden="true"
                                className="size-4 text-emerald-600"
                              />
                            )}
                          </button>
                        )
                      })}
                      {filteredMembers.length === 0 && (
                        <p className="px-2 py-4 text-sm text-muted-foreground">
                          No members found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => attachmentInputRef.current?.click()}
              >
                <Paperclip aria-hidden="true" />
                Attachment
              </Button>
              <input
                ref={attachmentInputRef}
                className="sr-only"
                type="file"
                multiple
                onChange={(event) => handleAddAttachments(event.target.files)}
              />
            </div>

            <section className="mt-8 pl-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlignLeft
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Description</h3>
                </div>
                {!isEditingDescription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="mt-4 flex flex-col gap-3">
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add a description..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleSaveDescription()}
                      disabled={updateCardMutation.isPending}
                    >
                      {updateCardMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDescription(card.description ?? '')
                        setIsEditingDescription(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-muted/40 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {card.description || 'No description yet.'}
                  </p>
                </div>
              )}
            </section>

            <section ref={checklistRef} className="mt-8 pl-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Checklist</h3>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {checklistCompletedCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHideCheckedItems((current) => !current)}
                    >
                      {hideCheckedItems
                        ? 'Show checked items'
                        : 'Hide checked items'}
                    </Button>
                  )}
                  {checklistItems.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChecklistItems([])}
                    >
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
                {visibleChecklistItems.map((item) => (
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
                      onClick={() =>
                        setChecklistItems((current) =>
                          current.map((currentItem) =>
                            currentItem.id === item.id
                              ? {
                                  ...currentItem,
                                  completed: !currentItem.completed,
                                }
                              : currentItem,
                          ),
                        )
                      }
                    >
                      {item.completed && (
                        <Check aria-hidden="true" className="size-3" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      {editingChecklistItemId === item.id ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={editingChecklistItemText}
                            onChange={(event) =>
                              setEditingChecklistItemText(event.target.value)
                            }
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveChecklistItem(item.id)}
                              disabled={!editingChecklistItemText.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingChecklistItemId(null)
                                setEditingChecklistItemText('')
                              }}
                            >
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
                          onClick={() => {
                            setEditingChecklistItemId(item.id)
                            setEditingChecklistItemText(item.text)
                          }}
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
                      onClick={() =>
                        setChecklistItems((current) =>
                          current.filter(
                            (currentItem) => currentItem.id !== item.id,
                          ),
                        )
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={handleAddChecklistItem}
              >
                <Input
                  value={checklistText}
                  onChange={(event) => setChecklistText(event.target.value)}
                  placeholder="Add an item"
                />
                <Button type="submit" disabled={!checklistText.trim()}>
                  Add
                </Button>
              </form>
            </section>

            {assignedMembers.length > 0 && (
              <section className="mt-8 pl-9">
                <div className="flex items-center gap-3">
                  <Users
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold">Members</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedMembers.map((member) => (
                    <Badge
                      key={member}
                      className="gap-1 border-white/55 bg-white/55 text-foreground shadow-sm backdrop-blur-xl"
                    >
                      {member}
                      <button
                        type="button"
                        className="rounded-full text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${member}`}
                        onClick={() => handleToggleAssignedMember(member)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {attachments.length > 0 && (
              <section ref={attachmentsRef} className="mt-8 pl-9">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Paperclip
                      aria-hidden="true"
                      className="size-5 text-muted-foreground"
                    />
                    <h3 className="text-base font-semibold">Attachments</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    Add
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
                              onChange={(event) =>
                                setEditingAttachmentName(event.target.value)
                              }
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  handleSaveAttachmentName(attachment.id)
                                }
                                disabled={!editingAttachmentName.trim()}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingAttachmentId(null)
                                  setEditingAttachmentName('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="truncate text-sm font-medium">
                              {attachment.name}
                            </p>
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
                        onClick={() =>
                          window.open(attachment.url, '_blank', 'noopener')
                        }
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
                          <DropdownMenuItem
                            onSelect={() =>
                              window.open(attachment.url, '_blank', 'noopener')
                            }
                          >
                            <ExternalLink aria-hidden="true" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingAttachmentId(attachment.id)
                              setEditingAttachmentName(attachment.name)
                            }}
                          >
                            <Edit3 aria-hidden="true" />
                            Edit name
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleDownloadAttachment(attachment)
                            }
                          >
                            <Download aria-hidden="true" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                              handleDeleteAttachment(attachment.id)
                            }
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
            )}
          </section>

          <aside className="min-h-0 overflow-y-auto border-t bg-muted/35 px-4 py-5 md:border-t-0 md:border-l">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <h3 className="font-semibold">Comments and activity</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails((current) => !current)}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </Button>
            </div>

            {showDetails && (
              <div className="mt-4 rounded-lg border bg-background/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {card.completed ? 'Complete' : 'Open'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">{comments.length}</span>
                </div>
              </div>
            )}

            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => void handleAddComment(event)}
            >
              <Input
                className="bg-background"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <Button
                type="submit"
                disabled={
                  !commentText.trim() || createCommentMutation.isPending
                }
              >
                {createCommentMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </form>

            <div className="mt-4 flex items-start gap-3 rounded-lg bg-background/60 p-3">
              <Avatar className="bg-orange-500 text-white" size="sm">
                <AvatarFallback>{activityAuthor.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm">
                <p>
                  <span className="font-semibold">{activityAuthor.name}</span>{' '}
                  added this card to the board
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Just now</p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 rounded-lg bg-background/70 p-3"
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {getInitials(comment.authorName) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{comment.authorName}</p>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit comment"
                          onClick={() => {
                            setEditingCommentId(comment.id)
                            setEditingCommentText(comment.body)
                          }}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remove comment"
                          onClick={() => void handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(event) =>
                            setEditingCommentText(event.target.value)
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSaveComment(comment.id)}
                            disabled={
                              !editingCommentText.trim() ||
                              updateCommentMutation.isPending
                            }
                          >
                            {updateCommentMutation.isPending
                              ? 'Saving...'
                              : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditingCommentText('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap break-words">
                        {comment.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(comment.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
