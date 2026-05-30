import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { attachmentRoutes } from './routes/attachments'
import { authRoutes } from './routes/auth'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { healthRoutes } from './routes/health'
import { listRoutes } from './routes/lists'
import { workspaceRoutes } from './routes/workspaces'
import type { AppEnv } from './lib/env'

const app = new Hono<AppEnv>()

app.onError((error, c) => {
  console.error(error)

  return c.json({ success: false, error: 'Internal Server Error' }, 500)
})

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
)

app.route('/api/health', healthRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/workspaces', workspaceRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/lists', listRoutes)
app.route('/api/cards', cardRoutes)
app.route('/api/attachments', attachmentRoutes)

export default app
