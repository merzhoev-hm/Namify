<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const mountEl = ref<HTMLElement | null>(null)
const error = ref<string>('')

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

onMounted(async () => {
  try {
    const cfg = await fetch('/api/config', { credentials: 'include' }).then((r) => r.json())
    const clientId: string | null = cfg.googleClientId ?? null
    if (!clientId) {
      error.value = 'Google Client ID не настроен'
      return
    }

    await loadScript('https://accounts.google.com/gsi/client')

    // @ts-ignore
    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        try {
          await auth.loginWithGoogleCredential(resp.credential)
        } catch {
          error.value = 'Не удалось войти'
        }
      },
    })

    if (mountEl.value) {
      // @ts-ignore
      google.accounts.id.renderButton(mountEl.value, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
      })
    }
  } catch {
    error.value = 'Ошибка загрузки Google входа'
  }
})
</script>

<template>
  <div>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
      Войдите, чтобы сохранять историю и настройки.
    </p>

    <div ref="mountEl"></div>

    <p v-if="error" class="mt-3 text-xs text-rose-500">{{ error }}</p>
  </div>
</template>
