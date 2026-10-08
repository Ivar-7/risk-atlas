type TokenProvider = () => Promise<string | null>

let tokenProvider: TokenProvider | null = null

export function setModelTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider
}

export async function authorizedModelFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await tokenProvider?.()
  if (!token) throw new Error('Sign in to access the model API')
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(path, {
    ...init,
    headers,
  })
}
