<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTldsStore } from '@/stores/tlds'
import { useSuggestionsStore } from '@/stores/suggestions'
import TldSelector from '@/components/TldSelector.vue'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import SuggestionCard from '@/components/SuggestionCard.vue'

// Сторы
const tlds = useTldsStore()
const suggestionsStore = useSuggestionsStore()
const auth = useAuthStore()
const fav = useFavoritesStore()

// Локальный стейт
const idea = ref('')
const MAX_IDEA_LEN = 100
const warning = ref('')

type NameStyle = 'corporate' | 'creative' | 'strict' | 'premium'

const STYLE_KEY = 'namify_style'
const style = ref<NameStyle>((localStorage.getItem(STYLE_KEY) as NameStyle) || 'corporate')

const styleOptions: Array<{ key: NameStyle; title: string; hint: string }> = [
  { key: 'corporate', title: 'Корпоративный', hint: '2 слова, деловой стиль' },
  { key: 'creative', title: 'Креативный', hint: 'неологизмы, смелее' },
  { key: 'strict', title: 'Строгий', hint: 'простые, без лишнего' },
  { key: 'premium', title: 'Премиум', hint: 'дорого, минимализм' },
]

const styleHint = computed(() => styleOptions.find((s) => s.key === style.value)?.hint ?? '')

function setStyle(s: NameStyle) {
  style.value = s
  localStorage.setItem(STYLE_KEY, s)
}

// Счётчик символов
const ideaCount = computed(() => idea.value.length)
const ideaCounterClass = computed(() =>
  ideaCount.value >= MAX_IDEA_LEN
    ? 'text-rose-500'
    : ideaCount.value >= MAX_IDEA_LEN - 10
      ? 'text-amber-500'
      : 'text-gray-500 dark:text-gray-400',
)

const canGenerate = computed(() => idea.value.trim().length >= 2 && tlds.selected.length > 0)

function onGenerate() {
  if (!canGenerate.value) return
  suggestionsStore.generate(idea.value, [...tlds.selected], style.value)
}

// Следим за лимитом символов
function onInput() {
  warning.value = idea.value.length >= MAX_IDEA_LEN ? 'Достигнут лимит' : ''
}

watch(
  () => auth.user,
  (u) => {
    if (u) fav.load().catch(() => {})
    else fav.clearLocal()
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white">
    <div class="max-w-3xl mx-auto p-6 md:p-10">
      <!-- Заголовок -->
      <h1 class="text-2xl font-bold md:text-3xl text-center">
        AI поможет выбрать имя, которое запомнят
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
        Онлайн генератор уникальных названий для проектов и бизнеса
      </p>

      <!-- Ввод идеи -->
      <div
        class="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 md:p-6 shadow-sm"
      >
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium">Идея проекта</label>
          <div class="flex items-center gap-2">
            <span v-if="warning" class="text-xs text-rose-500 font-medium">{{ warning }}</span>
            <span class="text-xs" :class="ideaCounterClass">
              {{ ideaCount }}/{{ MAX_IDEA_LEN }}
            </span>
          </div>
        </div>

        <!-- ВАЖНО: всё внутри одного form -->
        <form @submit.prevent="onGenerate">
          <input
            v-model="idea"
            @input="onInput"
            type="text"
            :maxlength="MAX_IDEA_LEN"
            placeholder="например: Махачкала кофе"
            class="w-full rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 mb-2"
          />
          <!-- Стиль -->
          <div class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium">Стиль</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ styleHint }}</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="opt in styleOptions"
                :key="opt.key"
                type="button"
                @click="setStyle(opt.key)"
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

          <!-- TLD селектор -->
          <TldSelector />

          <div class="mt-6 flex gap-3">
            <button
              type="submit"
              :disabled="!canGenerate || suggestionsStore.generating"
              class="w-full rounded-xl px-5 py-3 text-sm font-semibold border border-black dark:border-white hover:bg-gray-100/80 dark:hover:bg-zinc-800/70 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
            >
              {{ suggestionsStore.generating ? 'Генерирую...' : 'Сгенерировать' }}
            </button>
          </div>
        </form>
      </div>
      <!-- Избранное (только после входа) -->
      <div
        v-if="auth.user"
        class="mt-6 bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-4 md:p-6 shadow-sm"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-sm font-semibold">Избранное</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{
                fav.loading
                  ? 'Загрузка…'
                  : `Имена: ${fav.names.length}, домены: ${fav.domains.length}`
              }}
            </div>
          </div>

          <button
            type="button"
            @click="fav.clearAll()"
            :disabled="fav.loading"
            class="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-zinc-700 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Очистить всё
          </button>
        </div>

        <p v-if="fav.error" class="mt-3 text-xs text-rose-500">{{ fav.error }}</p>

        <div v-if="fav.names.length" class="mt-4">
          <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Имена</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="n in fav.names"
              :key="n.id"
              class="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 px-3 py-1 text-sm"
            >
              <span class="font-semibold">{{ n.value }}</span>

              <button
                type="button"
                @click="fav.removeFavorite('name', n.value)"
                class="text-xs opacity-60 hover:opacity-100"
                aria-label="Удалить из избранного"
                title="Удалить"
              >
                ✕
              </button>
            </span>
          </div>
        </div>

        <div v-if="fav.domains.length" class="mt-4">
          <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Домены</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="d in fav.domains"
              :key="d.id"
              class="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 px-3 py-1 text-sm"
            >
              <span class="font-semibold">{{ d.value }}</span>

              <button
                type="button"
                @click="fav.removeFavorite('domain', d.value)"
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
          v-if="!fav.loading && !fav.names.length && !fav.domains.length"
          class="mt-4 text-sm text-gray-600 dark:text-gray-400"
        >
          Пока пусто — добавь ⭐ рядом с именем или доменом.
        </div>
      </div>

      <!-- Карточки -->
      <div class="mt-8 grid gap-4">
        <div
          v-for="(card, idx) in suggestionsStore.suggestions"
          :key="card.id"
          class="opacity-0 animate-fade-in-up"
          :style="{ animationDelay: `${idx * 120}ms`, animationFillMode: 'forwards' }"
        >
          <SuggestionCard :suggestion="card" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.4s ease both;
}
</style>
