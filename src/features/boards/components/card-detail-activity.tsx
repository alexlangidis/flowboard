import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getInitials } from '@/features/boards/components/card-detail-utils'
import type { BoardCard } from '@/features/boards/types'

type ActivityAuthor = {
  initials: string
  name: string
}

export function CardDetailActivity({
  activityAuthor,
  card,
  commentText,
  comments,
  deleteCommentPending,
  editingCommentId,
  editingCommentText,
  onAddComment,
  onCommentTextChange,
  onDeleteComment,
  onEditingCommentTextChange,
  onSaveComment,
  onShowDetailsChange,
  onStartEditComment,
  onStopEditComment,
  showDetails,
  updateCommentPending,
  createCommentPending,
}: {
  activityAuthor: ActivityAuthor
  card: BoardCard
  commentText: string
  comments: NonNullable<BoardCard['comments']>
  createCommentPending: boolean
  deleteCommentPending: boolean
  editingCommentId: string | null
  editingCommentText: string
  onAddComment: (event: FormEvent<HTMLFormElement>) => void
  onCommentTextChange: (text: string) => void
  onDeleteComment: (commentId: string) => void
  onEditingCommentTextChange: (text: string) => void
  onSaveComment: (commentId: string) => void
  onShowDetailsChange: () => void
  onStartEditComment: (comment: NonNullable<BoardCard['comments']>[number]) => void
  onStopEditComment: () => void
  showDetails: boolean
  updateCommentPending: boolean
}) {
  return (
    <aside className="min-h-0 overflow-y-auto border-t bg-muted/35 px-4 py-5 md:border-t-0 md:border-l">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare aria-hidden="true" className="size-4 text-muted-foreground" />
          <h3 className="font-semibold">Comments and activity</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onShowDetailsChange}>
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

      <form className="mt-4 flex gap-2" onSubmit={onAddComment}>
        <Input
          className="bg-background"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
        />
        <Button type="submit" disabled={!commentText.trim() || createCommentPending}>
          {createCommentPending ? 'Adding...' : 'Add'}
        </Button>
      </form>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-background/60 p-3">
        <Avatar className="bg-orange-500 text-white" size="sm">
          <AvatarFallback>{activityAuthor.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-sm">
          <p>
            <span className="font-semibold">{activityAuthor.name}</span> added
            this card to the board
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
              <AvatarFallback>{getInitials(comment.authorName) || 'U'}</AvatarFallback>
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
                    onClick={() => onStartEditComment(comment)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove comment"
                    onClick={() => onDeleteComment(comment.id)}
                    disabled={deleteCommentPending}
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
                      onEditingCommentTextChange(event.target.value)
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onSaveComment(comment.id)}
                      disabled={!editingCommentText.trim() || updateCommentPending}
                    >
                      {updateCommentPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onStopEditComment}
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
  )
}
