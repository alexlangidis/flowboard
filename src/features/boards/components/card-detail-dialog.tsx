import {
  Check,
  CheckCircle2,
  Paperclip,
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import {
  deleteAttachment,
  getAttachmentBlob,
  listCardAttachments,
  updateAttachmentName,
  uploadCardAttachment,
} from '@/features/boards/api/attachments-api'
import { CardDetailActivity } from '@/features/boards/components/card-detail-activity'
import { CardDetailAttachments } from '@/features/boards/components/card-detail-attachments'
import { CardDetailChecklist } from '@/features/boards/components/card-detail-checklist'
import { CardDetailDescription } from '@/features/boards/components/card-detail-description'
import { CardDetailTitle } from '@/features/boards/components/card-detail-title'
import {
  attachmentAccept,
  getInitials,
} from '@/features/boards/components/card-detail-utils'
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
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
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

  useEffect(() => {
    let ignore = false

    async function loadAttachments() {
      if (!open) {
        return
      }

      try {
        const response = await listCardAttachments(card.id)

        if (!ignore) {
          setAttachments(
            response.data.attachments.map((attachment) => ({
              id: attachment.id,
              name: attachment.fileName,
              size: attachment.sizeBytes ?? 0,
              contentType: attachment.contentType,
              createdAt: attachment.createdAt,
            })),
          )
        }
      } catch (error) {
        if (!ignore) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Unable to load attachments.',
          )
        }
      }
    }

    void loadAttachments()

    return () => {
      ignore = true
    }
  }, [card.id, open])

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

  async function handleAddAttachments(files: FileList | null) {
    if (!files?.length) {
      return
    }

    setIsUploadingAttachment(true)

    try {
      const uploadedAttachments = await Promise.all(
        Array.from(files).map((file) => uploadCardAttachment(card.id, file)),
      )

      setAttachments((current) => [
        ...current,
        ...uploadedAttachments.map((response) => ({
          id: response.data.attachment.id,
          name: response.data.attachment.fileName,
          size: response.data.attachment.sizeBytes ?? 0,
          contentType: response.data.attachment.contentType,
          createdAt: response.data.attachment.createdAt,
        })),
      ])
      toast.success(
        files.length === 1 ? 'Attachment uploaded.' : 'Attachments uploaded.',
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to upload attachment.',
      )
    } finally {
      setIsUploadingAttachment(false)
    }

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  async function handleSaveAttachmentName(attachmentId: string) {
    if (!editingAttachmentName.trim()) {
      return
    }

    try {
      const response = await updateAttachmentName(
        attachmentId,
        editingAttachmentName.trim(),
      )

      setAttachments((current) =>
        current.map((attachment) =>
          attachment.id === attachmentId
            ? {
                ...attachment,
                name: response.data.attachment.fileName,
              }
            : attachment,
        ),
      )
      setEditingAttachmentId(null)
      setEditingAttachmentName('')
      toast.success('Attachment renamed.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to rename attachment.',
      )
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await deleteAttachment(attachmentId)
      setAttachments((current) =>
        current.filter((item) => item.id !== attachmentId),
      )
      toast.success('Attachment deleted.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete attachment.',
      )
    }
  }

  async function handleOpenAttachment(attachment: CardAttachmentItem) {
    try {
      const blob = await getAttachmentBlob(attachment.id, 'open')
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'noopener')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to open attachment.',
      )
    }
  }

  async function handleDownloadAttachment(attachment: CardAttachmentItem) {
    try {
      const blob = await getAttachmentBlob(attachment.id, 'download')
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = attachment.name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to download attachment.',
      )
    }
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
            <CardDetailTitle
              boardId={boardId}
              completed={card.completed}
              isEditing={isEditingTitle}
              isPending={updateCardMutation.isPending}
              onCancel={() => {
                setTitle(card.title)
                setTitleError(null)
                setIsEditingTitle(false)
              }}
              onEdit={startEditingTitle}
              onSave={() => void handleSaveTitle()}
              onTitleChange={setTitle}
              onToggleCompleted={() => void handleToggleCompleted()}
              title={isEditingTitle ? title : card.title}
              titleError={titleError}
            />

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
                accept={attachmentAccept}
                multiple
                onChange={(event) =>
                  void handleAddAttachments(event.target.files)
                }
              />
            </div>

            <CardDetailDescription
              description={
                isEditingDescription ? description : (card.description ?? '')
              }
              isEditing={isEditingDescription}
              isPending={updateCardMutation.isPending}
              onCancel={() => {
                setDescription(card.description ?? '')
                setIsEditingDescription(false)
              }}
              onChange={setDescription}
              onEdit={() => setIsEditingDescription(true)}
              onSave={() => void handleSaveDescription()}
            />

            <CardDetailChecklist
              checklistProgress={checklistProgress}
              completedCount={checklistCompletedCount}
              editingItemId={editingChecklistItemId}
              editingItemText={editingChecklistItemText}
              hideCheckedItems={hideCheckedItems}
              items={checklistItems}
              onAddItem={handleAddChecklistItem}
              onClearItems={() => setChecklistItems([])}
              onEditingItemTextChange={setEditingChecklistItemText}
              onHideCheckedItemsChange={() =>
                setHideCheckedItems((current) => !current)
              }
              onItemTextChange={setChecklistText}
              onRemoveItem={(itemId) =>
                setChecklistItems((current) =>
                  current.filter((item) => item.id !== itemId),
                )
              }
              onSaveItem={handleSaveChecklistItem}
              onStartEditItem={(item) => {
                setEditingChecklistItemId(item.id)
                setEditingChecklistItemText(item.text)
              }}
              onStopEditItem={() => {
                setEditingChecklistItemId(null)
                setEditingChecklistItemText('')
              }}
              onToggleItem={(itemId) =>
                setChecklistItems((current) =>
                  current.map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          completed: !item.completed,
                        }
                      : item,
                  ),
                )
              }
              sectionRef={checklistRef}
              text={checklistText}
              visibleItems={visibleChecklistItems}
            />

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

            <CardDetailAttachments
              attachments={attachments}
              editingAttachmentId={editingAttachmentId}
              editingAttachmentName={editingAttachmentName}
              isUploading={isUploadingAttachment}
              onDelete={(attachmentId) =>
                void handleDeleteAttachment(attachmentId)
              }
              onDownload={(attachment) => void handleDownloadAttachment(attachment)}
              onEditingNameChange={setEditingAttachmentName}
              onOpen={(attachment) => void handleOpenAttachment(attachment)}
              onPickFiles={() => attachmentInputRef.current?.click()}
              onSaveName={(attachmentId) =>
                void handleSaveAttachmentName(attachmentId)
              }
              onStartEdit={(attachment) => {
                setEditingAttachmentId(attachment.id)
                setEditingAttachmentName(attachment.name)
              }}
              onStopEdit={() => {
                setEditingAttachmentId(null)
                setEditingAttachmentName('')
              }}
              sectionRef={attachmentsRef}
            />
          </section>

          <CardDetailActivity
            activityAuthor={activityAuthor}
            card={card}
            commentText={commentText}
            comments={comments}
            createCommentPending={createCommentMutation.isPending}
            deleteCommentPending={deleteCommentMutation.isPending}
            editingCommentId={editingCommentId}
            editingCommentText={editingCommentText}
            onAddComment={(event) => void handleAddComment(event)}
            onCommentTextChange={setCommentText}
            onDeleteComment={(commentId) => void handleDeleteComment(commentId)}
            onEditingCommentTextChange={setEditingCommentText}
            onSaveComment={(commentId) => void handleSaveComment(commentId)}
            onShowDetailsChange={() => setShowDetails((current) => !current)}
            onStartEditComment={(comment) => {
              setEditingCommentId(comment.id)
              setEditingCommentText(comment.body)
            }}
            onStopEditComment={() => {
              setEditingCommentId(null)
              setEditingCommentText('')
            }}
            showDetails={showDetails}
            updateCommentPending={updateCommentMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
