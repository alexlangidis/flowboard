import type { Context } from 'hono'

import type { AppEnv } from './env'

const encoder = new TextEncoder()
const AUTH_COOKIE_NAME = 'flowboard_session'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

type AuthTokenPayload = {
  sub: string
  email: string
  name: string
  exp: number
}

export type CurrentUser = {
  id: string
  email: string
  name: string
}

function base64UrlEncode(value: ArrayBuffer | string) {
  const bytes =
    typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded)

  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(value: string, secret: string) {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))

  return base64UrlEncode(signature)
}

async function verifySignature(
  value: string,
  signature: string,
  secret: string,
) {
  const key = await importHmacKey(secret)

  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(signature),
    encoder.encode(value),
  )
}

async function derivePasswordHash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100_000,
    },
    key,
    256,
  )

  return base64UrlEncode(bits)
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePasswordHash(password, salt)

  return `pbkdf2_sha256$100000$${base64UrlEncode(salt.buffer)}$${hash}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, , encodedSalt, expectedHash] = storedHash.split('$')

  if (algorithm !== 'pbkdf2_sha256' || !encodedSalt || !expectedHash) {
    return false
  }

  const hash = await derivePasswordHash(password, base64UrlDecode(encodedSalt))

  return hash === expectedHash
}

export async function createAuthToken(user: CurrentUser, secret: string) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    } satisfies AuthTokenPayload),
  )
  const signingInput = `${header}.${payload}`
  const signature = await sign(signingInput, secret)

  return `${signingInput}.${signature}`
}

export async function verifyAuthToken(token: string, secret: string) {
  const [header, payload, signature] = token.split('.')

  if (!header || !payload || !signature) {
    return null
  }

  const valid = await verifySignature(`${header}.${payload}`, signature, secret)

  if (!valid) {
    return null
  }

  const decoded = new TextDecoder().decode(base64UrlDecode(payload))
  const tokenPayload = JSON.parse(decoded) as AuthTokenPayload

  if (tokenPayload.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return {
    id: tokenPayload.sub,
    email: tokenPayload.email,
    name: tokenPayload.name,
  } satisfies CurrentUser
}

function getCookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

export function createAuthCookie(token: string) {
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_TTL_SECONDS}`
}

export function clearAuthCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export async function getCurrentUser(c: Context<AppEnv>) {
  const authHeader = c.req.header('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined
  const cookieToken = getCookieValue(c.req.header('Cookie'), AUTH_COOKIE_NAME)
  const token = bearerToken ?? cookieToken

  if (!token) {
    return null
  }

  return verifyAuthToken(token, c.env.AUTH_SECRET)
}
