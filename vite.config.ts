import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(async ({ command }) => {
  const plugins = [vue()]

  // ✅ Devtools только в режиме разработки (vite dev)
  if (command === 'serve') {
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.push(vueDevTools())
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:8787',
      },
    },
  }
})
