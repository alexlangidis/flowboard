import { getApiAuthHeaders } from './api-auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type ApiErrorResponse = {
  error?: string
  message?: string
}

type ApiRequestOptions<TBody> = Omit<RequestInit, 'body' | 'method'> & {
  body?: TBody
}

export class ApiClientError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

async function request<TResponse, TBody = unknown>(
  method: HttpMethod,
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const { body, headers, ...init } = options
  let response: Response
  const authHeaders = await getApiAuthHeaders()

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    })
  } catch {
    throw new ApiClientError(
      'Unable to reach the API. Start the Worker with npm run dev:full or npm run dev:worker.',
      0,
    )
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`

    try {
      const errorBody = (await response.json()) as ApiErrorResponse
      errorMessage = errorBody.error ?? errorBody.message ?? errorMessage
    } catch {
      // Keep the status-based fallback when the response is not JSON.
    }

    throw new ApiClientError(errorMessage, response.status)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}

export const apiClient = {
  get: <TResponse>(path: string, options?: ApiRequestOptions<never>) =>
    request<TResponse>('GET', path, options),
  post: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) => request<TResponse, TBody>('POST', path, { ...options, body }),
  patch: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) => request<TResponse, TBody>('PATCH', path, { ...options, body }),
  delete: <TResponse>(path: string, options?: ApiRequestOptions<never>) =>
    request<TResponse>('DELETE', path, options),
}
