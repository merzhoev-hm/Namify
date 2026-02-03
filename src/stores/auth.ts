import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AuthUser = {
  id: string
  email: string | null
  name: string | null
  picture: string | null
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: 'include' })
  const data = (await r.json()) as T
  if (!r.ok) throw data
  return data
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body ?? {}),
  })
  const data = (await r.json()) as T
  if (!r.ok) throw data
  return data
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  async function me() {
    const data = await getJson<{ user: AuthUser | null }>('/api/auth/me')
    user.value = data.user ?? null
  }

  async function loginWithGoogleCredential(credential: string) {
    const data = await postJson<{ user: AuthUser }>('/api/auth/google', { credential })
    user.value = data.user
  }

  async function logout() {
    await postJson('/api/auth/logout')
    user.value = null
  }

  return { user, me, logout, loginWithGoogleCredential }
})
