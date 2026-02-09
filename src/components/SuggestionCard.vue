<script setup lang="ts">
import { toRef } from 'vue'
import type { Suggestion } from '@/stores/suggestions'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps<{ suggestion: Suggestion }>()
const suggestion = toRef(props, 'suggestion')
const auth = useAuthStore()
const fav = useFavoritesStore()

function toggleOpen() {
  suggestion.value.open = !suggestion.value.open
}

function statusClass(status: string, checking: boolean) {
  if (checking) return 'bg-slate-500 text-white'
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
    <div class="flex gap-3 flex-row items-center justify-between">
      <div>
        <div class="text-lg font-semibold dark:text-white">{{ suggestion.label }}</div>
      </div>

      <button
        v-if="auth.user"
        type="button"
        @click="fav.toggleName(suggestion.label, suggestion.description)"
        :class="[
          'self-start rounded-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80',
          fav.isFavName(suggestion.label)
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : '',
        ]"
        aria-label="В избранное"
      >
        {{ fav.isFavName(suggestion.label) ? '★' : '☆' }}
      </button>
    </div>

    <p class="text-sm text-gray-600 dark:text-gray-400">{{ suggestion.description }}</p>

    <div class="mt-4">
      <button
        @click="toggleOpen"
        class="w-full sm:w-auto text-xs font-semibold inline-flex items-center justify-center gap-2 border border-black dark:border-white rounded-full px-3 py-2 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
      >
        Показать варианты домена
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          :class="['h-4 w-4 transition-transform duration-300', suggestion.open ? 'rotate-90' : '']"
          fill="none"
          stroke="currentColor"
        >
          <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-96 opacity-100"
        leave-active-class="transition-all duration-500 ease-in"
        leave-from-class="max-h-96 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div v-if="suggestion.open" class="mt-2 overflow-hidden">
          <div
            v-for="item in suggestion.items"
            :key="item.fqdn"
            class="flex flex-col gap-2 py-2 border-b border-gray-100 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-2">
              <button
                v-if="auth.user"
                type="button"
                @click="fav.toggleDomain(item.fqdn)"
                :class="[
                  'text-sm px-2 py-1 rounded-full border border-gray-200 dark:border-zinc-700 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80',
                  fav.isFavDomain(item.fqdn)
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : '',
                ]"
                aria-label="В избранное"
              >
                {{ fav.isFavDomain(item.fqdn) ? '★' : '☆' }}
              </button>

              <div class="text-sm font-medium">{{ item.fqdn }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <a
                v-if="!item.checking && item.status === 'available'"
                :href="item.registerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs order-2 sm:order-1 font-semibold px-3 py-1 rounded-full border border-black dark:border-white hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
              >
                Зарегистрировать домен
              </a>
              <span
                :class="[
                  'text-xs order-1 sm:order-2 font-semibold px-2 py-1 rounded-full',
                  statusClass(item.status, item.checking),
                ]"
              >
                {{
                  item.checking
                    ? 'Проверяем...'
                    : item.status === 'available'
                      ? 'Доступен'
                      : item.status === 'taken'
                        ? 'Занят'
                        : 'Неизвестно'
                }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
