<script setup lang="ts">
import type { AuthUser } from '@/stores/auth'
import type { FavoriteRow } from '@/stores/favorites'

const props = defineProps<{
  user: AuthUser | null
  loading: boolean
  error: string
  names: FavoriteRow[]
  domains: FavoriteRow[]
}>()

const emit = defineEmits<{
  (e: 'clearAll'): void
  (e: 'remove', kind: 'name' | 'domain', value: string): void
}>()
</script>

<template>
  <details
    v-if="props.user"
    class="group mt-6 bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 md:p-6 shadow-sm"
    open
  >
    <summary class="flex cursor-pointer list-none items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold">Избранное</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{
            loading ? 'Загрузка…' : `Имена: ${names.length}, домены: ${domains.length}`
          }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="emit('clearAll')"
          :disabled="loading"
          class="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-zinc-700 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Очистить всё
        </button>

        <span
          class="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 group-open:rotate-180 transition"
          aria-hidden="true"
        >
          ▾
        </span>
      </div>
    </summary>

    <div class="mt-4">
      <p v-if="error" class="mt-3 text-xs text-rose-500">{{ error }}</p>

      <div v-if="names.length" class="mt-4">
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Имена</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="n in names"
            :key="n.id"
            class="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 px-3 py-1 text-sm"
          >
            <span class="font-semibold">{{ n.value }}</span>

            <button
              type="button"
              @click="emit('remove', 'name', n.value)"
              class="text-xs opacity-60 hover:opacity-100"
              aria-label="Удалить из избранного"
              title="Удалить"
            >
              ✕
            </button>
          </span>
        </div>
      </div>

      <div v-if="domains.length" class="mt-4">
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Домены</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="d in domains"
            :key="d.id"
            class="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 px-3 py-1 text-sm"
          >
            <span class="font-semibold">{{ d.value }}</span>

            <button
              type="button"
              @click="emit('remove', 'domain', d.value)"
              class="text-xs opacity-60 hover:opacity-100"
              aria-label="Удалить из избранного"
              title="Удалить"
            >
              ✕
            </button>
          </span>
        </div>
      </div>

      <div
        v-if="!loading && !names.length && !domains.length"
        class="mt-4 text-sm text-gray-600 dark:text-gray-400"
      >
        Пока пусто — добавь ⭐ рядом с именем или доменом.
      </div>
    </div>
  </details>
</template>
