import { and, desc, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { createDb } from '../db/client'
import { boards, cards, lists, workspaceMembers } from '../db/schema'
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
        position: (lastCard?.position ?? -1) + 1,
      })
      .returning({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        description: cards.description,
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
