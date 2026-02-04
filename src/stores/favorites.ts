import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type FavoriteRow = {
  id: number
  kind: 'name' | 'domain'
  value: string // хранится в базе lower-case
  description?: string | null
  createdAt: string
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

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref<FavoriteRow[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string>('')

  const nameSet = computed(() => {
    const s = new Set<string>()
    for (const it of items.value) if (it.kind === 'name') s.add(it.value)
    return s
  })

  const domainSet = computed(() => {
    const s = new Set<string>()
    for (const it of items.value) if (it.kind === 'domain') s.add(it.value)
    return s
  })

  const names = computed(() => items.value.filter((x) => x.kind === 'name'))
  const domains = computed(() => items.value.filter((x) => x.kind === 'domain'))

  function isFavName(label: string) {
    return nameSet.value.has(label.toLowerCase())
  }

  function isFavDomain(fqdn: string) {
    return domainSet.value.has(fqdn.toLowerCase())
  }

  function resolveErrorMessage(error: unknown, fallback: string) {
    if (error && typeof error === 'object' && 'error' in error) {
      return String((error as { error?: unknown }).error ?? fallback)
    }
    return fallback
  }

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const data = await getJson<{ items: FavoriteRow[] }>('/api/favorites')
      items.value = Array.isArray(data.items) ? data.items : []
      loaded.value = true
    } catch (e: unknown) {
      // если не авторизован — просто считаем что избранного “нет”
      if (e && typeof e === 'object' && 'error' in e && (e as { error?: unknown }).error === 'Unauthorized') {
        items.value = []
        loaded.value = false
        return
      }
      error.value = resolveErrorMessage(e, 'Не удалось загрузить избранное')
    } finally {
      loading.value = false
    }
  }

  async function toggleName(label: string, description?: string) {
    error.value = ''
    const value = label.toLowerCase()

    // optimistic UI
    const had = isFavName(label)

    try {
      await postJson('/api/favorites/toggle', {
        kind: 'name',
        value,
        description: description ?? null,
      })
      await load()
    } catch (e: unknown) {
      // лимит
      error.value = resolveErrorMessage(e, 'Не удалось сохранить')
      // откат не нужен — мы после load синхронизируемся
      if (had) await load()
    }
  }

  async function toggleDomain(fqdn: string) {
    error.value = ''
    const value = fqdn.toLowerCase()
    const had = isFavDomain(fqdn)

    try {
      await postJson('/api/favorites/toggle', { kind: 'domain', value })
      await load()
    } catch (e: unknown) {
      error.value = resolveErrorMessage(e, 'Не удалось сохранить')
      if (had) await load()
    }
  }

  async function clearAll() {
    error.value = ''
    try {
      await postJson('/api/favorites/clear')
      await load()
    } catch (e: unknown) {
      error.value = resolveErrorMessage(e, 'Не удалось очистить избранное')
    }
  }

  function clearLocal() {
    items.value = []
    loaded.value = false
    loading.value = false
    error.value = ''
  }

  async function removeFavorite(kind: 'name' | 'domain', value: string) {
    error.value = ''
    try {
      await postJson('/api/favorites/toggle', { kind, value: value.toLowerCase() })
      await load()
    } catch (e: unknown) {
      error.value = resolveErrorMessage(e, 'Не удалось удалить')
    }
  }

  return {
    items,
    names,
    domains,
    loaded,
    loading,
    error,
    isFavName,
    isFavDomain,
    load,
    toggleName,
    toggleDomain,
    clearLocal,
    removeFavorite,
    clearAll,
  }
})
