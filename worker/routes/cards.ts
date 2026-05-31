import { and, desc, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { createDb } from '../db/client'
import {
  attachments,
  boards,
  cards,
  comments,
  lists,
  users,
  workspaceMembers,
} from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'

const createCardSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})

const moveCardSchema = z.object({
  cardId: z.string().uuid(),
  toListId: z.string().uuid(),
  toIndex: z.number().int().min(0),
})

const updateCardSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  completed: z.boolean().optional(),
})

const createCommentSchema = z.object({
  body: z.string().min(1).max(1000),
})

const updateCommentSchema = z.object({
  body: z.string().min(1).max(1000),
})

function serializeComment(comment: {
  id: string
  cardId: string
  authorId: string
  authorName: string
  body: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }
}

async function getAccessibleList(
  db: ReturnType<typeof createDb>,
  listId: string,
  userId: string,
) {
  const [list] = await db
    .select({
      id: lists.id,
      boardId: lists.boardId,
    })
    .from(lists)
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, boards.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(lists.id, listId))
    .limit(1)

  return list
}

async function getAccessibleCard(
  db: ReturnType<typeof createDb>,
  cardId: string,
  userId: string,
) {
  const [card] = await db
    .select({
      id: cards.id,
      listId: cards.listId,
      boardId: lists.boardId,
      title: cards.title,
      description: cards.description,
      completed: cards.completed,
      position: cards.position,
    })
    .from(cards)
    .innerJoin(lists, eq(lists.id, cards.listId))
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, boards.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(cards.id, cardId))
    .limit(1)

  return card
}

async function getAccessibleComment(
  db: ReturnType<typeof createDb>,
  commentId: string,
  userId: string,
) {
  const [comment] = await db
    .select({
      id: comments.id,
      cardId: comments.cardId,
      authorId: comments.authorId,
      authorName: users.name,
      body: comments.body,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      boardId: lists.boardId,
    })
    .from(comments)
    .innerJoin(cards, eq(cards.id, comments.cardId))
    .innerJoin(lists, eq(lists.id, cards.listId))
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .innerJoin(users, eq(users.id, comments.authorId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, boards.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(comments.id, commentId))
    .limit(1)

  return comment
}

export const cardRoutes = new Hono<AppEnv>()
  .get('/', (c) => {
    return c.json({
      success: true,
      data: {
        cards: [],
      },
    })
  })
  .post('/', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const input = await parseJsonBody(c.req.raw, createCardSchema)
    const db = createDb(c.env)
    const [list] = await db
      .select({
        id: lists.id,
        boardId: lists.boardId,
      })
      .from(lists)
      .innerJoin(boards, eq(boards.id, lists.boardId))
      .innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, boards.workspaceId),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .where(eq(lists.id, input.listId))
      .limit(1)

    if (!list) {
      return c.json({ success: false, error: 'List not found' }, 404)
    }

    const [lastCard] = await db
      .select({ position: cards.position })
      .from(cards)
      .where(eq(cards.listId, input.listId))
      .orderBy(desc(cards.position))
      .limit(1)
    const [card] = await db
      .insert(cards)
      .values({
        listId: input.listId,
        title: input.title,
        description: input.description,
        completed: false,
        position: (lastCard?.position ?? -1) + 1,
      })
      .returning({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        description: cards.description,
        completed: cards.completed,
        position: cards.position,
      })

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, list.boardId))

    return c.json(
      {
        success: true,
        data: {
          card,
        },
      },
      201,
    )
  })
  .patch('/move', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const input = await parseJsonBody(c.req.raw, moveCardSchema)
    const db = createDb(c.env)
    const [card] = await db
      .select({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        description: cards.description,
        completed: cards.completed,
        position: cards.position,
      })
      .from(cards)
      .where(eq(cards.id, input.cardId))
      .limit(1)

    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }

    const fromList = await getAccessibleList(db, card.listId, user.id)
    const toList = await getAccessibleList(db, input.toListId, user.id)

    if (!fromList || !toList || fromList.boardId !== toList.boardId) {
      return c.json({ success: false, error: 'List not found' }, 404)
    }

    const affectedListIds = Array.from(new Set([fromList.id, toList.id]))
    const affectedCards = await db
      .select({
        id: cards.id,
        listId: cards.listId,
      })
      .from(cards)
      .where(inArray(cards.listId, affectedListIds))
      .orderBy(cards.position)
    const nextByListId = new Map<
      string,
      Array<{ id: string; listId: string }>
    >()

    for (const listId of affectedListIds) {
      nextByListId.set(
        listId,
        affectedCards.filter(
          (affectedCard) =>
            affectedCard.listId === listId && affectedCard.id !== input.cardId,
        ),
      )
    }

    const targetCards = nextByListId.get(input.toListId) ?? []
    const insertIndex = Math.max(0, Math.min(input.toIndex, targetCards.length))

    targetCards.splice(insertIndex, 0, {
      id: card.id,
      listId: input.toListId,
    })
    nextByListId.set(input.toListId, targetCards)

    for (const [listId, listCards] of nextByListId.entries()) {
      await Promise.all(
        listCards.map((listCard, position) =>
          db
            .update(cards)
            .set({
              listId,
              position,
              updatedAt: new Date(),
            })
            .where(eq(cards.id, listCard.id)),
        ),
      )
    }

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, toList.boardId))

    const [updatedCard] = await db
      .select({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        description: cards.description,
        completed: cards.completed,
        position: cards.position,
      })
      .from(cards)
      .where(eq(cards.id, input.cardId))
      .limit(1)

    return c.json({
      success: true,
      data: {
        card: updatedCard,
      },
    })
  })
  .post('/:cardId/comments', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const cardId = c.req.param('cardId')
    const card = await getAccessibleCard(db, cardId, user.id)

    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }

    const input = await parseJsonBody(c.req.raw, createCommentSchema)
    const [comment] = await db
      .insert(comments)
      .values({
        cardId,
        authorId: user.id,
        body: input.body,
      })
      .returning({
        id: comments.id,
        cardId: comments.cardId,
        authorId: comments.authorId,
        body: comments.body,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, card.boardId))

    return c.json(
      {
        success: true,
        data: {
          comment: serializeComment({
            ...comment,
            authorName: user.name,
          }),
        },
      },
      201,
    )
  })
  .patch('/comments/:commentId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const commentId = c.req.param('commentId')
    const existingComment = await getAccessibleComment(db, commentId, user.id)

    if (!existingComment) {
      return c.json({ success: false, error: 'Comment not found' }, 404)
    }

    if (existingComment.authorId !== user.id) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }

    const input = await parseJsonBody(c.req.raw, updateCommentSchema)
    const [comment] = await db
      .update(comments)
      .set({
        body: input.body,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning({
        id: comments.id,
        cardId: comments.cardId,
        authorId: comments.authorId,
        body: comments.body,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, existingComment.boardId))

    return c.json({
      success: true,
      data: {
        comment: serializeComment({
          ...comment,
          authorName: existingComment.authorName,
        }),
      },
    })
  })
  .delete('/comments/:commentId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const commentId = c.req.param('commentId')
    const comment = await getAccessibleComment(db, commentId, user.id)

    if (!comment) {
      return c.json({ success: false, error: 'Comment not found' }, 404)
    }

    if (comment.authorId !== user.id) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }

    await db.delete(comments).where(eq(comments.id, commentId))
    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, comment.boardId))

    return c.json({
      success: true,
      data: {
        deletedCommentId: commentId,
        cardId: comment.cardId,
      },
    })
  })
  .patch('/:cardId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const cardId = c.req.param('cardId')
    const existingCard = await getAccessibleCard(db, cardId, user.id)

    if (!existingCard) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }

    const input = await parseJsonBody(c.req.raw, updateCardSchema)
    const [card] = await db
      .update(cards)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.completed !== undefined
          ? { completed: input.completed }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(cards.id, cardId))
      .returning({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        description: cards.description,
        completed: cards.completed,
        position: cards.position,
      })

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, existingCard.boardId))

    return c.json({
      success: true,
      data: {
        card,
      },
    })
  })
  .delete('/:cardId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const cardId = c.req.param('cardId')
    const card = await getAccessibleCard(db, cardId, user.id)

    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }

    await db.delete(attachments).where(eq(attachments.cardId, cardId))
    await db.delete(comments).where(eq(comments.cardId, cardId))
    await db.delete(cards).where(eq(cards.id, cardId))

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, card.boardId))

    return c.json({
      success: true,
      data: {
        deletedCardId: cardId,
      },
    })
  })
