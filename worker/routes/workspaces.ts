import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { createDb } from '../db/client'
import { workspaceMembers, workspaces } from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { getOrCreateDefaultWorkspace } from '../lib/workspaces'

export const workspaceRoutes = new Hono<AppEnv>().get('/', async (c) => {
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
      workspaces: userWorkspaces.map((workspace) => ({
        ...workspace,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      })),
    },
  })
})
