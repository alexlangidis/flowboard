import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { clearAuthCookie, getCurrentUser } from '../lib/auth'
import { createDb } from '../db/client'
import { users } from '../db/schema'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'

const updateCurrentUserSchema = z.object({
  name: z.string().min(1).max(80),
})

export const authRoutes = new Hono<AppEnv>()
  .post('/logout', (c) => {
    c.header('Set-Cookie', clearAuthCookie())

    return c.json({ success: true, data: { ok: true } })
  })
  .get('/me', async (c) => {
    const user = await getCurrentUser(c)

    return c.json({
      success: true,
      data: {
        user,
      },
    })
  })
  .patch('/me', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const input = await parseJsonBody(c.req.raw, updateCurrentUserSchema)
    const db = createDb(c.env)
    const [updatedUser] = await db
      .update(users)
      .set({
        name: input.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    return c.json({
      success: true,
      data: {
        user: updatedUser,
      },
    })
  })
