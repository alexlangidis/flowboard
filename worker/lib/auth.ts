import type { Context } from 'hono'
import { eq, or } from 'drizzle-orm'
import { createRemoteJWKSet, jwtVerify } from 'jose'

import { createDb } from '../db/client'
import { users } from '../db/schema'
import type { AppEnv } from './env'

const AUTH_COOKIE_NAME = 'flowboard_session'

type NeonAuthJwtPayload = {
  sub?: string
  userId?: string
  email?: string
  name?: string
}

type AuthUserInput = {
  authUserId: string
  email?: string
  name?: string
}

export type CurrentUser = {
  id: string
  email: string
  name: string
}

function getNeonAuthUrl(c: Context<AppEnv>) {
  return c.env.NEON_AUTH_URL ?? c.env.VITE_NEON_AUTH_URL
}

function getNeonAuthJwksUrl(authUrl: string) {
  return new URL(`${authUrl.replace(/\/+$/, '')}/.well-known/jwks.json`)
}

async function verifyNeonAuthToken(token: string, c: Context<AppEnv>) {
  const authUrl = getNeonAuthUrl(c)

  if (!authUrl) {
    throw new Error('NEON_AUTH_URL is required for API authentication.')
  }

  const { payload } = await jwtVerify(
    token,
    createRemoteJWKSet(getNeonAuthJwksUrl(authUrl)),
  )
  const neonPayload = payload as NeonAuthJwtPayload
  const authUserId = neonPayload.userId ?? neonPayload.sub

  if (!authUserId) {
    return null
  }

  return {
    authUserId,
    email: neonPayload.email,
    name: neonPayload.name,
  }
}

function serializeCurrentUser(user: {
  id: string
  email: string
  name: string
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  } satisfies CurrentUser
}

async function findExistingCurrentUser(
  db: ReturnType<typeof createDb>,
  authUser: AuthUserInput,
) {
  const where = authUser.email
    ? or(
        eq(users.authUserId, authUser.authUserId),
        eq(users.email, authUser.email),
      )
    : eq(users.authUserId, authUser.authUserId)

  return db.query.users.findFirst({ where })
}

async function getOrCreateCurrentUser(
  c: Context<AppEnv>,
  authUser: AuthUserInput,
) {
  const db = createDb(c.env)
  const existingUser = await findExistingCurrentUser(db, authUser)

  if (existingUser) {
    if (existingUser.authUserId === authUser.authUserId) {
      return serializeCurrentUser(existingUser)
    }

    const [linkedUser] = await db
      .update(users)
      .set({
        authUserId: authUser.authUserId,
        name: authUser.name ?? existingUser.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    if (linkedUser) {
      return serializeCurrentUser(linkedUser)
    }
  }

  try {
    const [createdUser] = await db
      .insert(users)
      .values({
        authUserId: authUser.authUserId,
        email: authUser.email ?? `${authUser.authUserId}@neon-auth.local`,
        name: authUser.name ?? 'User',
        passwordHash: 'neon-auth-managed',
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    if (createdUser) {
      return serializeCurrentUser(createdUser)
    }
  } catch (error) {
    const racedUser = await findExistingCurrentUser(db, authUser)

    if (racedUser) {
      return serializeCurrentUser(racedUser)
    }

    throw error
  }

  throw new Error('Unable to create current user.')
}

export function clearAuthCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export async function getCurrentUser(c: Context<AppEnv>) {
  const authHeader = c.req.header('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined

  if (bearerToken) {
    const authUser = await verifyNeonAuthToken(bearerToken, c)

    if (!authUser) {
      return null
    }

    return getOrCreateCurrentUser(c, authUser)
  }

  return null
}
