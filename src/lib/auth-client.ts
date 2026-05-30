import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL

if (!neonAuthUrl) {
  throw new Error('VITE_NEON_AUTH_URL is required for Neon Auth.')
}

export const authClient = createAuthClient(neonAuthUrl, {
  adapter: BetterAuthReactAdapter(),
})
