import { defineStore } from 'pinia'
import { ref } from 'vue'
import { makeNameVariants, buildRegisterUrl, generateDescription } from '@/utils/generator'

type Tld = string
type DomainStatus = 'available' | 'taken' | 'unknown'

export type TldResult = {
  tld: Tld
  fqdn: string
  status: DomainStatus
  checking: boolean
  registerUrl: string
}

export type Suggestion = {
  id: string
  label: string
  base: string
  description: string
  open: boolean
  items: TldResult[]
}

type ApiNamesResponse = {
  suggestions: Array<{ label: string; base?: string; description?: string }>
  mode?: 'openai' | 'mock' | 'fallback'
}

type ApiDomainsResponse = {
  results: Array<{ domain: string; status: DomainStatus }>
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return (await r.json()) as T
}

export const useSuggestionsStore = defineStore('suggestions', () => {
  const generating = ref(false)
  const suggestions = ref<Suggestion[]>([])

  async function checkAllDomains() {
    const allItems = suggestions.value.flatMap((s) => s.items)
    if (allItems.length === 0) return

    // включаем "проверяем..."
    allItems.forEach((i) => {
      i.checking = true
    })

    try {
      const data = await postJson<ApiDomainsResponse>('/api/domains/check', {
        domains: allItems.map((i) => i.fqdn),
      })

      const map = new Map<string, DomainStatus>()
      data.results.forEach((r) => map.set(r.domain, r.status))

      allItems.forEach((i) => {
        i.status = map.get(i.fqdn) ?? 'unknown'
        i.checking = false
      })
    } catch {
      allItems.forEach((i) => {
        i.status = 'unknown'
        i.checking = false
      })
    }
  }

  async function generate(idea: string, selectedTlds: string[]) {
    if (!idea || selectedTlds.length === 0) return
    generating.value = true

    try {
      // 1) пытаемся взять реальные имена с сервера
      const data = await postJson<ApiNamesResponse>('/api/names', { idea, count: 4 })

      const variants = (data.suggestions ?? [])
        .filter((x) => x.label && (x.base || x.label))
        .slice(0, 4)
        .map((x) => ({
          label: x.label,
          base: (x.base ?? x.label).toString().toLowerCase().replace(/\s+/g, '-'),
          description: x.description,
        }))

      suggestions.value = variants.map((v) => ({
        id: crypto.randomUUID(),
        label: v.label,
        base: v.base,
        description: v.description ?? generateDescription(v.label),
        open: false,
        items: selectedTlds.map((tld) => ({
          tld,
          fqdn: `${v.base}.${tld}`,
          status: 'unknown' as DomainStatus,
          checking: false,
          registerUrl: buildRegisterUrl(`${v.base}.${tld}`),
        })),
      }))

      // 2) автопроверка доменов (не блокируем UI)
      void checkAllDomains()
    } catch {
      // fallback на текущую локальную логику (чтобы всё работало даже без бэка)
      const variants = makeNameVariants(idea)

      suggestions.value = variants.map((v) => ({
        id: crypto.randomUUID(),
        label: v.label,
        base: v.base,
        description: generateDescription(v.label),
        open: false,
        items: selectedTlds.map((tld) => ({
          tld,
          fqdn: `${v.base}.${tld}`,
          status: 'unknown' as DomainStatus,
          checking: false,
          registerUrl: buildRegisterUrl(`${v.base}.${tld}`),
        })),
      }))
    } finally {
      generating.value = false
    }
  }

  return {
    generating,
    suggestions,
    generate,
  }
})
