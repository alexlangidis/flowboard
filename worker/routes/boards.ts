import { and, desc, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'

import { createDb } from '../db/client'
import {
  attachments,
  boardStars,
  boards,
  cards,
  comments,
  lists,
  users,
  workspaceMembers,
  workspaces,
} from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'
import { getOrCreateDefaultWorkspace } from '../lib/workspaces'

const createBoardSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  workspaceId: z.string().uuid().optional(),
})

const updateBoardSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(240).nullable().optional(),
})

const starBoardSchema = z.object({
  isStarred: z.boolean(),
})

async function requireCurrentUser(c: Context<AppEnv>) {
  const user = await getCurrentUser(c)

  if (!user) {
    return null
  }

  return user
}

async function getAccessibleBoard(
  db: ReturnType<typeof createDb>,
  boardId: string,
  userId: string,
) {
  const [board] = await db
    .select({
      id: boards.id,
      workspaceId: boards.workspaceId,
      workspaceName: workspaces.name,
      name: boards.name,
      description: boards.description,
      updatedAt: boards.updatedAt,
    })
    .from(boards)
    .innerJoin(workspaces, eq(workspaces.id, boards.workspaceId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, workspaces.id),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(boards.id, boardId))
    .limit(1)

  return board
}

async function getStarredBoardIds(
  db: ReturnType<typeof createDb>,
  userId: string,
  boardIds: string[],
) {
  if (boardIds.length === 0) {
    return new Set<string>()
  }

  const stars = await db
    .select({ boardId: boardStars.boardId })
    .from(boardStars)
    .where(
      and(eq(boardStars.userId, userId), inArray(boardStars.boardId, boardIds)),
    )

  return new Set(stars.map((star) => star.boardId))
}

function serializeBoard(
  board: {
    id: string
    workspaceId: string
    workspaceName: string
    name: string
    description: string | null
    updatedAt: Date
  },
  isStarred: boolean,
) {
  return {
    ...board,
    visibility: 'Workspace' as const,
    isStarred,
    updatedAt: board.updatedAt.toISOString(),
  }
}

export const boardRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const user = await requireCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    await getOrCreateDefaultWorkspace(db, user)

    const userBoards = await db
      .select({
        id: boards.id,
        workspaceId: boards.workspaceId,
        workspaceName: workspaces.name,
        name: boards.name,
        description: boards.description,
        updatedAt: boards.updatedAt,
      })
      .from(boards)
      .innerJoin(workspaces, eq(workspaces.id, boards.workspaceId))
      .innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, workspaces.id),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .orderBy(desc(boards.updatedAt))
    const starredBoardIds = await getStarredBoardIds(
      db,
      user.id,
      userBoards.map((board) => board.id),
    )

    return c.json({
      success: true,
      data: {
        boards: userBoards.map((board) =>
          serializeBoard(board, starredBoardIds.has(board.id)),
        ),
      },
    })
  })
  .post('/', async (c) => {
    const user = await requireCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const input = await parseJsonBody(c.req.raw, createBoardSchema)
    const db = createDb(c.env)
    const workspaceId =
      input.workspaceId ?? (await getOrCreateDefaultWorkspace(db, user))
    const [membership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .limit(1)

    if (!membership) {
      return c.json({ success: false, error: 'Workspace not found' }, 404)
    }

    const [board] = await db
      .insert(boards)
      .values({
        workspaceId,
        name: input.name,
        description: input.description,
      })
      .returning({
        id: boards.id,
        workspaceId: boards.workspaceId,
        name: boards.name,
        description: boards.description,
        updatedAt: boards.updatedAt,
      })
    const [workspace] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)

    return c.json(
      {
        success: true,
        data: {
          board: serializeBoard(
            {
              ...board,
              workspaceName: workspace.name,
            },
            false,
          ),
        },
      },
      201,
    )
  })
  .patch('/:boardId', async (c) => {
    const user = await requireCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const boardId = c.req.param('boardId')
    const existingBoard = await getAccessibleBoard(db, boardId, user.id)

    if (!existingBoard) {
      return c.json({ success: false, error: 'Board not found' }, 404)
    }

    const input = await parseJsonBody(c.req.raw, updateBoardSchema)
    const [board] = await db
      .update(boards)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(boards.id, boardId))
      .returning({
        id: boards.id,
        workspaceId: boards.workspaceId,
        name: boards.name,
        description: boards.description,
        updatedAt: boards.updatedAt,
      })
    const starredBoardIds = await getStarredBoardIds(db, user.id, [board.id])

    return c.json({
      success: true,
      data: {
        board: serializeBoard(
          {
            ...board,
            workspaceName: existingBoard.workspaceName,
          },
          starredBoardIds.has(board.id),
        ),
      },
    })
  })
  .patch('/:boardId/star', async (c) => {
    const user = await requireCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const boardId = c.req.param('boardId')
    const board = await getAccessibleBoard(db, boardId, user.id)

    if (!board) {
      return c.json({ success: false, error: 'Board not found' }, 404)
    }

    const input = await parseJsonBody(c.req.raw, starBoardSchema)

    if (input.isStarred) {
      await db
        .insert(boardStars)
        .values({ boardId, userId: user.id })
        .onConflictDoNothing()
    } else {
      await db
        .delete(boardStars)
        .where(
          and(eq(boardStars.boardId, boardId), eq(boardStars.userId, user.id)),
        )
    }

    return c.json({
      success: true,
      data: {
        board: serializeBoard(board, input.isStarred),
      },
    })
  })
  .delete('/:boardId', async (c) => {
    const user = await requireCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const boardId = c.req.param('boardId')
    const board = await getAccessibleBoard(db, boardId, user.id)

    if (!board) {
      return c.json({ success: false, error: 'Board not found' }, 404)
    }

    const boardLists = await db
      .select({ id: lists.id })
      .from(lists)
      .where(eq(lists.boardId, boardId))
    const listIds = boardLists.map((list) => list.id)
    const boardCards =
      listIds.length > 0
        ? await db
            .select({ id: cards.id })
            .from(cards)
            .where(inArray(cards.listId, listIds))
        : []
    const cardIds = boardCards.map((card) => card.id)

    if (cardIds.length > 0) {
      await db.delete(attachments).where(inArray(attachments.cardId, cardIds))
      await db.delete(comments).where(inArray(comments.cardId, cardIds))
    }

    if (listIds.length > 0) {
      await db.delete(cards).where(inArray(cards.listId, listIds))
      await db.delete(lists).where(eq(lists.boardId, boardId))
    }

    await db.delete(boardStars).where(eq(boardStars.boardId, boardId))
    await db.delete(boards).where(eq(boards.id, boardId))

    return c.json({
      success: true,
      data: {
        deletedBoardId: boardId,
      },
    })
  })
  .get('/:boardId', async (c) => {
    const user = await requireCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const boardId = c.req.param('boardId')
    const board = await getAccessibleBoard(db, boardId, user.id)

    if (!board) {
      return c.json({ success: false, error: 'Board not found' }, 404)
    }

    const boardLists = await db
      .select({
        id: lists.id,
        boardId: lists.boardId,
        name: lists.name,
        position: lists.position,
      })
      .from(lists)
      .where(eq(lists.boardId, board.id))
      .orderBy(lists.position)
    const listIds = boardLists.map((list) => list.id)
    const boardCards =
      listIds.length > 0
        ? await db
            .select({
              id: cards.id,
              listId: cards.listId,
              title: cards.title,
              description: cards.description,
              completed: cards.completed,
              position: cards.position,
            })
            .from(cards)
            .where(inArray(cards.listId, listIds))
            .orderBy(cards.position)
        : []
    const cardIds = boardCards.map((card) => card.id)
    const boardComments =
      cardIds.length > 0
        ? await db
            .select({
              id: comments.id,
              cardId: comments.cardId,
              authorId: comments.authorId,
              authorName: users.name,
              body: comments.body,
              createdAt: comments.createdAt,
              updatedAt: comments.updatedAt,
            })
            .from(comments)
            .innerJoin(users, eq(users.id, comments.authorId))
            .where(inArray(comments.cardId, cardIds))
            .orderBy(desc(comments.createdAt))
        : []

    return c.json({
      success: true,
      data: {
        board: {
          ...serializeBoard(
            board,
            (await getStarredBoardIds(db, user.id, [board.id])).has(board.id),
          ),
          lists: boardLists.map((list) => ({
            ...list,
            cards: boardCards
              .filter((card) => card.listId === list.id)
              .map((card) => ({
                ...card,
                comments: boardComments
                  .filter((comment) => comment.cardId === card.id)
                  .map((comment) => ({
                    ...comment,
                    createdAt: comment.createdAt.toISOString(),
                    updatedAt: comment.updatedAt.toISOString(),
                  })),
              })),
          })),
        },
      },
    })
  })
