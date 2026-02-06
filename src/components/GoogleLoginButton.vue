<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const mountEl = ref<HTMLElement | null>(null)
const error = ref<string>('')
const ready = ref(false)

let ro: ResizeObserver | null = null
let lastWidth = 0
let rerenderFrame = 0

type GoogleCredentialResponse = { credential: string }

type GoogleAccounts = {
  accounts: {
    id: {
      renderButton: (
        element: HTMLElement,
        options: {
          theme: 'outline'
          size: 'large'
          shape: 'pill'
          text: 'signin_with'
          width: number
        },
      ) => void
      initialize: (options: {
        client_id: string
        callback: (resp: GoogleCredentialResponse) => void
      }) => void
    }
  }
}

declare const google: GoogleAccounts

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const exists = document.querySelector(`script[src="${src}"]`)
    if (exists) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
}

function renderGoogleButton() {
  if (!mountEl.value) return
  const width = mountEl.value.clientWidth || 320
  if (width === lastWidth) return
  lastWidth = width
  mountEl.value.innerHTML = ''
  google.accounts.id.renderButton(mountEl.value, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    width,
  })
  ready.value = true
}

onMounted(async () => {
  try {
    const cfg = await fetch('/api/config', { credentials: 'include' }).then((r) => r.json())
    const clientId: string | null = cfg.googleClientId ?? null
    if (!clientId) {
      error.value = 'Google Client ID не настроен'
      return
    }

    await loadScript('https://accounts.google.com/gsi/client')

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: GoogleCredentialResponse) => {
        try {
          await auth.loginWithGoogleCredential(resp.credential)
        } catch {
          error.value = 'Не удалось войти'
        }
      },
    })

    if (mountEl.value) {
      requestAnimationFrame(() => renderGoogleButton())
      ro = new ResizeObserver(() => {
        if (mountEl.value) {
          cancelAnimationFrame(rerenderFrame)
          rerenderFrame = requestAnimationFrame(() => renderGoogleButton())
        }
      })
      ro.observe(mountEl.value)
    }
  } catch {
    error.value = 'Ошибка загрузки Google входа'
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  cancelAnimationFrame(rerenderFrame)
})
</script>

<template>
  <div>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
      Войдите, чтобы сохранять историю и настройки.
    </p>

    <div
      v-if="!ready"
      class="w-full h-12 rounded-full border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40 animate-pulse"
    ></div>

    <div ref="mountEl" class="w-full" :class="{ 'mt-2': !ready }"></div>

    <p v-if="error" class="mt-3 text-xs text-rose-500">{{ error }}</p>
  </div>
</template>
