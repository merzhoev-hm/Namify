<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

function close() {
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.open,
  (v) => {
    // блокируем скролл фона, пока модалка открыта
    document.body.style.overflow = v ? 'hidden' : ''
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <!-- фон -->
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        aria-label="Закрыть"
        @click="close"
      />

      <!-- окно -->
      <div
        class="relative w-[92vw] max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-xl p-5"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Вход</h2>
          <button
            type="button"
            class="rounded-full px-3 py-2 text-sm hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
            @click="close"
          >
            ✕
          </button>
        </div>

        <div class="mt-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
