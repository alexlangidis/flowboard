import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { createDb } from '../db/client'
import { boards, lists, workspaceMembers } from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'

const createListSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1).max(80),
})

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
