<script setup lang="ts">
import { onMounted, ref } from 'vue'

const el = ref<HTMLElement | null>(null)

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

async function onCredential(credential: string) {
  const r = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  if (!r.ok) throw new Error('Auth failed')
  // просто перезагрузим страницу/или обновим стор — ниже покажу вариант со стором
  window.location.reload()
}

onMounted(async () => {
  const cfg = await fetch('/api/config').then((r) => r.json())
  const clientId = cfg.googleClientId
  if (!clientId) return

  await loadScript('https://accounts.google.com/gsi/client')

  // @ts-ignore
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp: any) => onCredential(resp.credential),
  })

  if (el.value) {
    // @ts-ignore
    google.accounts.id.renderButton(el.value, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
    })
  }
})
</script>

<template>
  <div ref="el"></div>
</template>
