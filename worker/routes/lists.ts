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
  workspaceMembers,
} from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'

const createListSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1).max(80),
})

const updateListSchema = z.object({
  name: z.string().min(1).max(80),
})

const moveListSchema = z.object({
  listId: z.string().uuid(),
  toIndex: z.number().int().min(0),
})

async function getAccessibleList(
  db: ReturnType<typeof createDb>,
  listId: string,
  userId: string,
) {
  const [list] = await db
    .select({
      id: lists.id,
      boardId: lists.boardId,
      name: lists.name,
      position: lists.position,
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

export const listRoutes = new Hono<AppEnv>()
  .get('/', (c) => {
    return c.json({
      success: true,
      data: {
        lists: [],
      },
    })
  })
  .post('/', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const input = await parseJsonBody(c.req.raw, createListSchema)
    const db = createDb(c.env)
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, boards.workspaceId),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .where(eq(boards.id, input.boardId))
      .limit(1)

    if (!board) {
      return c.json({ success: false, error: 'Board not found' }, 404)
    }

    const [lastList] = await db
      .select({ position: lists.position })
      .from(lists)
      .where(eq(lists.boardId, input.boardId))
      .orderBy(desc(lists.position))
      .limit(1)
    const [list] = await db
      .insert(lists)
      .values({
        boardId: input.boardId,
        name: input.name,
        position: (lastList?.position ?? -1) + 1,
      })
      .returning({
        id: lists.id,
        boardId: lists.boardId,
        name: lists.name,
        position: lists.position,
      })

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, input.boardId))

    return c.json(
      {
        success: true,
        data: {
          list: {
            ...list,
            cards: [],
          },
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

    const db = createDb(c.env)
    const input = await parseJsonBody(c.req.raw, moveListSchema)
    const movingList = await getAccessibleList(db, input.listId, user.id)

    if (!movingList) {
      return c.json({ success: false, error: 'List not found' }, 404)
    }

    const boardLists = await db
      .select({
        id: lists.id,
        boardId: lists.boardId,
        name: lists.name,
        position: lists.position,
      })
      .from(lists)
      .where(eq(lists.boardId, movingList.boardId))
      .orderBy(lists.position)
    const nextLists = boardLists.filter((list) => list.id !== input.listId)
    const insertIndex = Math.max(0, Math.min(input.toIndex, nextLists.length))

    nextLists.splice(insertIndex, 0, movingList)

    await Promise.all(
      nextLists.map((list, position) =>
        db
          .update(lists)
          .set({
            position,
            updatedAt: new Date(),
          })
          .where(eq(lists.id, list.id)),
      ),
    )

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, movingList.boardId))

    return c.json({
      success: true,
      data: {
        list: {
          ...movingList,
          position: insertIndex,
          cards: [],
        },
      },
    })
  })
  .patch('/:listId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const listId = c.req.param('listId')
    const existingList = await getAccessibleList(db, listId, user.id)

    if (!existingList) {
      return c.json({ success: false, error: 'List not found' }, 404)
    }

    const input = await parseJsonBody(c.req.raw, updateListSchema)
    const [list] = await db
      .update(lists)
      .set({
        name: input.name,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .returning({
        id: lists.id,
        boardId: lists.boardId,
        name: lists.name,
        position: lists.position,
      })

    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, existingList.boardId))

    return c.json({
      success: true,
      data: {
        list: {
          ...list,
          cards: [],
        },
      },
    })
  })
  .delete('/:listId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const listId = c.req.param('listId')
    const list = await getAccessibleList(db, listId, user.id)

    if (!list) {
      return c.json({ success: false, error: 'List not found' }, 404)
    }

    const listCards = await db
      .select({ id: cards.id })
      .from(cards)
      .where(eq(cards.listId, listId))
    const cardIds = listCards.map((card) => card.id)

    if (cardIds.length > 0) {
      await db.delete(attachments).where(inArray(attachments.cardId, cardIds))
      await db.delete(comments).where(inArray(comments.cardId, cardIds))
      await db.delete(cards).where(eq(cards.listId, listId))
    }

    await db.delete(lists).where(eq(lists.id, listId))
    await db
      .update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, list.boardId))

    return c.json({
      success: true,
      data: {
        deletedListId: listId,
      },
    })
  })
