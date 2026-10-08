export type AccountUser = { id: string; full_name: string; email: string }

async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { detail?: string }
    throw new Error(payload.detail || `Account service returned ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const registerAccount = (full_name: string, email: string, password: string) =>
  request<{ user: AccountUser }>('register', { full_name, email, password })

export const loginAccount = (email: string, password: string) =>
  request<{ user: AccountUser }>('login', { email, password })

export const currentAccount = () => request<{ user: AccountUser | null }>('me')

export async function logoutAccount(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  if (!response.ok) throw new Error('Could not sign out')
}
