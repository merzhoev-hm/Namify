<script setup lang="ts">
import { ref } from 'vue'
import type { Suggestion } from '@/stores/suggestions'

const props = defineProps<{ suggestion: Suggestion }>()
const open = ref(false)

function statusClass(status: string) {
  return status === 'available'
    ? 'bg-emerald-500 text-white'
    : status === 'taken'
      ? 'bg-rose-500 text-white'
      : 'bg-gray-900 text-white dark:bg-white dark:text-black'
}
</script>

<template>
  <div
    class="rounded-2xl p-6 border shadow-lg bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-700"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="text-lg font-semibold dark:text-white">{{ suggestion.label }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ suggestion.description }}
        </div>
      </div>

      <!-- (раньше здесь был блок с оценкой — удалён) -->
    </div>

    <div class="mt-4">
      <button
        @click="open = !open"
        class="text-xs font-semibold inline-flex items-center gap-2 border rounded-full px-3 py-2 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
      >
        <!-- статичный текст кнопки, не меняется в зависимости от состояния -->
        Показать варианты домена
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="h-4 w-4 transition-transform duration-300"
          :class="{ 'rotate-90': open }"
          fill="none"
          stroke="currentColor"
        >
          <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-96 opacity-100"
        leave-active-class="transition-all duration-500 ease-in"
        leave-from-class="max-h-96 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div v-if="open" class="mt-3 overflow-hidden">
          <div
            v-for="item in suggestion.items"
            :key="item.fqdn"
            class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800"
          >
            <div class="text-sm">
              <div class="font-medium">{{ item.fqdn }}</div>
            </div>
            <div class="flex items-center gap-2">
              <a
                v-if="item.status === 'available'"
                :href="item.registerUrl"
                target="_blank"
                rel="noopener"
                class="text-xs font-semibold px-3 py-2 border rounded-full"
              >
                Зарегистрировать
              </a>
              <span
                class="text-xs font-semibold px-2 py-1 rounded-full"
                :class="statusClass(item.status)"
              >
                {{
                  item.status === 'available'
                    ? 'Доступен'
                    : item.status === 'taken'
                      ? 'Занят'
                      : 'Неизвестно'
                }}
              </span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
