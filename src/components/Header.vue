<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/AuthModal.vue'
import GoogleLoginButton from '@/components/GoogleLoginButton.vue'

const auth = useAuthStore()
const authOpen = ref(false)

watchEffect(() => {
  if (auth.user) authOpen.value = false
})

const isDark = ref(false)

function applyTheme() {
  if (isDark.value) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme()
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') isDark.value = true
  applyTheme()
})
</script>

<template>
  <header
    class="w-full border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
  >
    <div
      class="container mx-auto max-w-4xl flex flex-col items-center gap-3 px-6 py-4 sm:flex-row sm:justify-between"
    >
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Namify</h1>

      <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
        <button
          v-if="!auth.user"
          type="button"
          @click="authOpen = true"
          class="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80 transition"
        >
          Войти
        </button>

        <div v-else class="flex items-center gap-2">
          <img
            v-if="auth.user.picture"
            :src="auth.user.picture"
            alt=""
            class="h-8 w-8 rounded-full"
          />
          <button
            type="button"
            @click="auth.logout"
            class="rounded-full px-3 py-2 text-xs font-semibold border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80 transition"
          >
            Выйти
          </button>
        </div>

        <button
          type="button"
          @click="toggleTheme"
          class="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        >
          <span class="transition-transform duration-500" :class="{ 'rotate-360': isDark }">
            {{ isDark ? '🌞' : '🌙' }}
          </span>
        </button>
      </div>
    </div>
  </header>

  <AuthModal :open="authOpen" @close="authOpen = false">
    <GoogleLoginButton />
  </AuthModal>
</template>
