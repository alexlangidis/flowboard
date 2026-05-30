import { eq } from 'drizzle-orm'

import type { createDb } from '../db/client'
import { workspaceMembers, workspaces } from '../db/schema'

type Db = ReturnType<typeof createDb>

type WorkspaceOwner = {
  id: string
  name: string
}

async function findWorkspaceMembership(db: Db, userId: string) {
  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1)

  return membership
}

export async function getOrCreateDefaultWorkspace(
  db: Db,
  user: WorkspaceOwner,
) {
  const membership = await findWorkspaceMembership(db, user.id)

  if (membership) {
    return membership.workspaceId
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: `${user.name}'s Workspace`,
      ownerId: user.id,
    })
    .returning({
      id: workspaces.id,
    })

  try {
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    })
  } catch (error) {
    const racedMembership = await findWorkspaceMembership(db, user.id)

    if (racedMembership) {
      return racedMembership.workspaceId
    }

    throw error
  }

  return workspace.id
}
