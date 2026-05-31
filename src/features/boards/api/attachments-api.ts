import { authClient } from '@/lib/auth-client'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export type CardAttachment = {
  id: string
  cardId: string
  uploadedById: string
  fileName: string
  contentType: string | null
  sizeBytes: number | null
  createdAt: string
}

type AttachmentsResponse = {
  success: true
  data: {
    attachments: CardAttachment[]
  }
}

type AttachmentResponse = {
  success: true
  data: {
    attachment: CardAttachment
  }
}

type DeleteAttachmentResponse = {
  success: true
  data: {
    deletedAttachmentId: string
  }
}

type ApiErrorResponse = {
  error?: string
  message?: string
}

async function getAuthHeaders() {
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

async function parseResponse<TResponse>(response: Response) {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`

    try {
      const errorBody = (await response.json()) as ApiErrorResponse
      errorMessage = errorBody.error ?? errorBody.message ?? errorMessage
    } catch {
      // Keep the status-based fallback when the response is not JSON.
    }

    throw new Error(errorMessage)
  }

  return response.json() as Promise<TResponse>
}

async function request<TResponse>(path: string, init: RequestInit = {}) {
  const authHeaders = await getAuthHeaders()
  const headers = new Headers(init.headers)

  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  return parseResponse<TResponse>(response)
}

export function listCardAttachments(cardId: string) {
  return request<AttachmentsResponse>(`/api/attachments/cards/${cardId}`, {
    credentials: 'include',
  })
}

export async function uploadCardAttachment(cardId: string, file: File) {
  const formData = new FormData()

  formData.set('file', file)

  return request<AttachmentResponse>(`/api/attachments/cards/${cardId}`, {
    body: formData,
    credentials: 'include',
    method: 'POST',
  })
}

export function updateAttachmentName(attachmentId: string, fileName: string) {
  return request<AttachmentResponse>(`/api/attachments/${attachmentId}`, {
    body: JSON.stringify({ fileName }),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })
}

export function deleteAttachment(attachmentId: string) {
  return request<DeleteAttachmentResponse>(`/api/attachments/${attachmentId}`, {
    credentials: 'include',
    method: 'DELETE',
  })
}

export async function getAttachmentBlob(
  attachmentId: string,
  mode: 'download' | 'open',
) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/attachments/${attachmentId}/${mode}`,
    {
      credentials: 'include',
      headers: authHeaders,
    },
  )

  if (!response.ok) {
    await parseResponse(response)
  }

  return response.blob()
}
