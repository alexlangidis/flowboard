import { Hono } from 'hono'

import { clearAuthCookie, getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'

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
