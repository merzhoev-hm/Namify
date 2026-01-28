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

// --- фикс "скачка" страницы из-за исчезновения скроллбара ---
let prevOverflow = ''
let prevPaddingRight = ''
let prevScrollTop = 0

function lockScroll() {
  prevOverflow = document.body.style.overflow
  prevPaddingRight = document.body.style.paddingRight

  // ширина скроллбара
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  // запомним позицию скролла
  prevScrollTop = window.scrollY || document.documentElement.scrollTop || 0

  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
}

function unlockScroll() {
  document.body.style.overflow = prevOverflow
  document.body.style.paddingRight = prevPaddingRight
  window.scrollTo(0, prevScrollTop)
}

watch(
  () => props.open,
  (v) => {
    if (v) lockScroll()
    else unlockScroll()
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  // на всякий случай возвращаем всё обратно
  unlockScroll()
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
        class="relative w-[92vw] max-w-md rounded-2xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200/70 dark:border-zinc-800 shadow-xl p-5"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Вход</h2>
          <button
            type="button"
            class="rounded-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
            @click="close"
          >
            ✕
          </button>
        </div>

        <div class="mt-4 min-h-[110px]">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
