import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { createDb } from '../db/client'
import {
  attachments,
  boardStars,
  boards,
  cards,
  comments,
  lists,
  workspaceMembers,
  workspaces,
} from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'
import { getOrCreateDefaultWorkspace } from '../lib/workspaces'

const workspaceInputSchema = z.object({
  name: z.string().min(1).max(80),
})

function serializeWorkspace(workspace: {
  id: string
  name: string
  ownerId: string
  role: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...workspace,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  }
}

export const workspaceRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    await getOrCreateDefaultWorkspace(db, user)

    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        ownerId: workspaces.ownerId,
        role: workspaceMembers.role,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, user.id))

    return c.json({
      success: true,
      data: {
        workspaces: userWorkspaces.map(serializeWorkspace),
      },
    })
  })
  .post('/', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const input = await parseJsonBody(c.req.raw, workspaceInputSchema)
    const db = createDb(c.env)
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: input.name.trim(),
        ownerId: user.id,
      })
      .returning({
        id: workspaces.id,
        name: workspaces.name,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })

    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    })

    return c.json(
      {
        success: true,
        data: {
          workspace: serializeWorkspace({
            ...workspace,
            role: 'owner',
          }),
        },
      },
      201,
    )
  })
  .patch('/:workspaceId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const workspaceId = c.req.param('workspaceId')
    const input = await parseJsonBody(c.req.raw, workspaceInputSchema)
    const db = createDb(c.env)
    const [membership] = await db
      .select({ role: workspaceMembers.role })
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

    if (membership.role !== 'owner') {
      return c.json(
        { success: false, error: 'Only owners can rename this workspace' },
        403,
      )
    }

    const [workspace] = await db
      .update(workspaces)
      .set({
        name: input.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning({
        id: workspaces.id,
        name: workspaces.name,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })

    return c.json({
      success: true,
      data: {
        workspace: serializeWorkspace({
          ...workspace,
          role: membership.role,
        }),
      },
    })
  })
  .delete('/:workspaceId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const workspaceId = c.req.param('workspaceId')
    const db = createDb(c.env)
    const [membership] = await db
      .select({ role: workspaceMembers.role })
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

    if (membership.role !== 'owner') {
      return c.json(
        { success: false, error: 'Only owners can delete this workspace' },
        403,
      )
    }

    const userWorkspaces = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id))

    if (userWorkspaces.length <= 1) {
      return c.json(
        {
          success: false,
          error: 'Create another workspace before deleting this one',
        },
        400,
      )
    }

    const workspaceBoards = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.workspaceId, workspaceId))
    const boardIds = workspaceBoards.map((board) => board.id)
    const workspaceLists =
      boardIds.length > 0
        ? await db
            .select({ id: lists.id })
            .from(lists)
            .where(inArray(lists.boardId, boardIds))
        : []
    const listIds = workspaceLists.map((list) => list.id)
    const workspaceCards =
      listIds.length > 0
        ? await db
            .select({ id: cards.id })
            .from(cards)
            .where(inArray(cards.listId, listIds))
        : []
    const cardIds = workspaceCards.map((card) => card.id)

    if (cardIds.length > 0) {
      await db.delete(attachments).where(inArray(attachments.cardId, cardIds))
      await db.delete(comments).where(inArray(comments.cardId, cardIds))
    }

    if (listIds.length > 0) {
      await db.delete(cards).where(inArray(cards.listId, listIds))
      await db.delete(lists).where(inArray(lists.id, listIds))
    }

    if (boardIds.length > 0) {
      await db.delete(boardStars).where(inArray(boardStars.boardId, boardIds))
      await db.delete(boards).where(inArray(boards.id, boardIds))
    }

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId))
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId))

    return c.json({
      success: true,
      data: {
        deletedWorkspaceId: workspaceId,
      },
    })
  })
