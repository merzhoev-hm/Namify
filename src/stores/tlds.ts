// src/stores/tlds.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const DEFAULT_TLDS = [
  'com',
  'ru',
  'net',
  'org',
  'xyz',
  'dev',
  'info',
  'site',
  'online',
  'store',
]

export const useTldsStore = defineStore('tlds', () => {
  const all = ref<string[]>([...DEFAULT_TLDS])
  const selected = ref<string[]>(['com', 'ru'])

  const has = (tld: string) => selected.value.includes(tld)

  function toggle(tld: string) {
    const idx = selected.value.indexOf(tld)
    if (idx === -1) selected.value.push(tld)
    else selected.value.splice(idx, 1)
  }

  function selectAll() {
    selected.value = [...all.value]
  }

  function clearAll() {
    selected.value = []
  }

  return {
    all,
    selected,
    has,
    toggle,
    selectAll,
    clearAll,
  }
})
