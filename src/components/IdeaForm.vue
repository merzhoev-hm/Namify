<script setup lang="ts">
import TldSelector from '@/components/TldSelector.vue'

type NameStyle = 'corporate' | 'creative' | 'strict' | 'premium'

type StyleOption = { key: NameStyle; title: string; hint: string }

const props = defineProps<{
  idea: string
  warning: string
  maxIdeaLen: number
  ideaCount: number
  ideaCounterClass: string
  style: NameStyle
  styleOptions: StyleOption[]
  styleHint: string
  canGenerate: boolean
  generating: boolean
}>()

const emit = defineEmits<{
  (e: 'update:idea', value: string): void
  (e: 'input'): void
  (e: 'generate'): void
  (e: 'setStyle', value: NameStyle): void
}>()

function onIdeaInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:idea', target?.value ?? '')
  emit('input')
}

function onStyleSelect(event: Event) {
  const target = event.target as HTMLSelectElement | null
  const value = (target?.value ?? props.style) as NameStyle
  emit('setStyle', value)
}
</script>

<template>
  <div
    class="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 md:p-6 shadow-sm"
  >
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-medium">Идея проекта</label>
      <div class="flex items-center gap-2">
        <span v-if="warning" class="text-xs text-rose-500 font-medium">{{ warning }}</span>
        <span class="text-xs" :class="ideaCounterClass"> {{ ideaCount }}/{{ maxIdeaLen }} </span>
      </div>
    </div>

    <form @submit.prevent="emit('generate')">
      <input
        :value="props.idea"
        @input="onIdeaInput"
        type="text"
        :maxlength="maxIdeaLen"
        placeholder="например: Махачкала кофе"
        class="w-full rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 mb-2"
      />
      <div class="mb-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">Стиль</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ styleHint }}</span>
        </div>

        <div class="sm:hidden">
          <select
            :value="style"
            @change="onStyleSelect"
            class="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-semibold"
          >
            <option v-for="opt in styleOptions" :key="opt.key" :value="opt.key">
              {{ opt.title }}
            </option>
          </select>
        </div>

        <div class="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            v-for="opt in styleOptions"
            :key="opt.key"
            type="button"
            @click="emit('setStyle', opt.key)"
            class="rounded-xl px-3 py-2 text-sm font-semibold border transition"
            :class="
              style === opt.key
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100/80 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800/80'
            "
          >
            {{ opt.title }}
          </button>
        </div>
      </div>

      <TldSelector />

      <div class="mt-6 flex gap-3">
        <button
          type="submit"
          :disabled="!canGenerate || generating"
          class="w-full rounded-xl px-5 py-3 text-sm font-semibold border border-black dark:border-white hover:bg-gray-100/80 dark:hover:bg-zinc-800/70 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
        >
          {{ generating ? 'Генерирую...' : 'Сгенерировать' }}
        </button>
      </div>
    </form>
  </div>
</template>
