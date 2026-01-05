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

export const useSuggestionsStore = defineStore('suggestions', () => {
  const generating = ref(false)
  const suggestions = ref<Suggestion[]>([])

  async function generate(idea: string, selectedTlds: string[]) {
    if (!idea || selectedTlds.length === 0) return
    generating.value = true

    setTimeout(() => {
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
      generating.value = false
    }, 300)
  }

  return {
    generating,
    suggestions,
    generate,
  }
})
