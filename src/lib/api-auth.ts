import { authClient } from './auth-client'

export async function getApiAuthHeaders() {
  const session = await authClient.getSession()
  const headers: Record<string, string> = {}

  if (session.data?.session.token) {
    headers.Authorization = `Bearer ${session.data.session.token}`
  }

  if (session.data?.user.email) {
    headers['X-Flowboard-User-Email'] = session.data.user.email
  }

  if (session.data?.user.name) {
    headers['X-Flowboard-User-Name'] = session.data.user.name
  }

  return headers
}
