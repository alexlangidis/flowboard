import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { createDb } from '../db/client'
import { users } from '../db/schema'
import {
  clearAuthCookie,
  createAuthCookie,
  createAuthToken,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const authRoutes = new Hono<AppEnv>()
  .post('/register', async (c) => {
    const input = await parseJsonBody(c.req.raw, registerSchema)
    const db = createDb(c.env)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (existingUser) {
      return c.json(
        { success: false, error: 'Email is already registered' },
        409,
      )
    }

    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      })

    const token = await createAuthToken(user, c.env.AUTH_SECRET)

    c.header('Set-Cookie', createAuthCookie(token))

    return c.json({ success: true, data: { user } }, 201)
  })
  .post('/login', async (c) => {
    const input = await parseJsonBody(c.req.raw, loginSchema)
    const db = createDb(c.env)
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401)
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    }
    const token = await createAuthToken(authUser, c.env.AUTH_SECRET)

    c.header('Set-Cookie', createAuthCookie(token))

    return c.json({ success: true, data: { user: authUser } })
  })
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
