<script setup lang="ts">
import { useTldsStore } from '@/stores/tlds'
const tlds = useTldsStore()
</script>
<template>
  <div>
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="text-sm font-medium">Выберите доменные окончания (TLD)</span>
      <div class="flex gap-2">
        <button @click="tlds.selectAll" class="cursor-pointer text-xs underline hover:opacity-60">
          Выбрать все
        </button>
        <button @click="tlds.clearAll" class="cursor-pointer text-xs underline hover:opacity-60">
          Снять выбор
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <label
        v-for="t in tlds.all"
        :key="t"
        class="cursor-pointer select-none rounded-full border px-3 py-1 text-sm"
        :class="
          tlds.has(t)
            ? 'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white border-transparent'
            : 'border-gray-300 dark:border-zinc-700 hover:bg-gray-100/60 dark:hover:bg-zinc-800/80'
        "
      >
        <input
          class="sr-only"
          type="checkbox"
          :checked="tlds.has(t)"
          @change="() => tlds.toggle(t)"
        />
        .{{ t }}
      </label>
    </div>
  </div>
</template>
