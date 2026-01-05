<script setup lang="ts">
import { ref, watchEffect } from 'vue'

// отслеживаем тему
const isDark = ref(false)

// переключаем тему
const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// при загрузке читаем из localStorage
watchEffect(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <header
    class="w-full border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
  >
    <div class="container mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
      <!-- Лого / название -->
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Namify</h1>

      <!-- Кнопка переключения темы -->
      <button
        @click="toggleTheme"
        class="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
      >
        <span class="transition-transform duration-500" :class="{ 'rotate-360': isDark }">
          {{ isDark ? '🌞' : '🌙' }}
        </span>
      </button>
    </div>
  </header>
</template>
