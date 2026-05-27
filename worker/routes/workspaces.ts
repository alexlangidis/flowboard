import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { createDb } from '../db/client'
import { workspaceMembers, workspaces } from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'

export const workspaceRoutes = new Hono<AppEnv>().get('/', async (c) => {
  const user = await getCurrentUser(c)

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const db = createDb(c.env)
  let userWorkspaces = await db
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

  if (userWorkspaces.length === 0) {
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: `${user.name}'s Workspace`,
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

    userWorkspaces = [
      {
        ...workspace,
        role: 'owner',
      },
    ]
  }

  return c.json({
    success: true,
    data: {
      workspaces: userWorkspaces.map((workspace) => ({
        ...workspace,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      })),
    },
  })
})
