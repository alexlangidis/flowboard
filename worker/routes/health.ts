import { Hono } from 'hono'

import type { AppEnv } from '../lib/env'

export const healthRoutes = new Hono<AppEnv>().get('/', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
    },
  })
})
