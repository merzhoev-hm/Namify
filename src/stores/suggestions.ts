import { defineStore } from 'pinia'
import { ref } from 'vue'
import { buildRegisterUrl, generateDescription, makeNameVariants } from '@/utils/generator'

type DomainStatus = 'available' | 'taken' | 'unknown'

export type TldResult = {
  tld: string
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
  mode?: 'groq' | 'openai' | 'mock' | 'fallback'
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

function labelToBase(label: string) {
  // Требование: base = label в нижнем регистре (без суффиксов типа -shop)
  // Оставляем только a-z0-9, чтобы домены были валидными.
  return label.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function makeUniqueBase(base: string, used: Set<string>) {
  let unique = base
  let n = 2
  while (used.has(unique)) unique = `${base}${n++}`.slice(0, 30)
  used.add(unique)
  return unique
}

function genId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function stripDomainsFromIdea(idea: string) {
  let s = String(idea ?? '')
  s = s.replace(/https?:\/\/\S+/gi, ' ')
  s = s.replace(/\b[a-z0-9-]+(\.[a-z0-9-]+)+\b/gi, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export const useSuggestionsStore = defineStore('suggestions', () => {
  const generating = ref(false)
  const suggestions = ref<Suggestion[]>([])

  async function checkAllDomains() {
    const allItems = suggestions.value.flatMap((s) => s.items)
    if (allItems.length === 0) return

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

  async function generate(
    idea: string,
    selectedTlds: string[],
    style: 'corporate' | 'creative' | 'strict' | 'premium' = 'corporate',
  ) {
    const cleanedIdea = stripDomainsFromIdea(idea)
    if (!cleanedIdea || selectedTlds.length === 0) return
    generating.value = true

    try {
      const data = await postJson<ApiNamesResponse>('/api/names', {
        idea: cleanedIdea,
        count: 4,
        style,
      })

      const used = new Set<string>()
      const variants = (data.suggestions ?? [])
        .map((x) => ({
          label: String(x.label ?? '').trim(),
          description: String(x.description ?? '').trim(),
        }))
        .filter((x) => x.label.length >= 2)
        .map((x) => {
          const baseRaw = labelToBase(x.label)
          const base = baseRaw.length >= 2 ? makeUniqueBase(baseRaw, used) : ''
          return {
            label: x.label,
            base,
            description: x.description || generateDescription(x.label),
          }
        })
        .filter((x) => x.base.length >= 2)
        .slice(0, 4)

      suggestions.value = variants.map((v) => ({
        id: genId(),
        label: v.label,
        base: v.base,
        description: v.description,
        open: false,
        items: selectedTlds.map((tld) => ({
          tld,
          fqdn: `${v.base}.${tld}`,
          status: 'unknown' as DomainStatus,
          checking: false,
          registerUrl: buildRegisterUrl(`${v.base}.${tld}`),
        })),
      }))

      void checkAllDomains()
    } catch {
      const used = new Set<string>()
      const variants = makeNameVariants(cleanedIdea)
        .map((v) => ({
          label: v.label,
          base: makeUniqueBase(labelToBase(v.label), used),
        }))
        .filter((v) => v.base.length >= 2)

      suggestions.value = variants.map((v) => ({
        id: genId(),
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

      void checkAllDomains()
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
