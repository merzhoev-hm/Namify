import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [vue()]

  // Devtools только при vite dev
  if (command === 'serve') {
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    const devtools = vueDevTools()
    if (devtools) plugins.push(devtools)
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
