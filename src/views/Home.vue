<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTldsStore } from '@/stores/tlds'
import { useSuggestionsStore } from '@/stores/suggestions'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import SuggestionCard from '@/components/SuggestionCard.vue'

import IdeaForm from '@/components/IdeaForm.vue'
import FavoritesPanel from '@/components/FavoritesPanel.vue'


import IdeaForm from '@/components/IdeaForm.vue'
import FavoritesPanel from '@/components/FavoritesPanel.vue'



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
      <IdeaForm
        v-model:idea="idea"
        :warning="warning"
        :max-idea-len="MAX_IDEA_LEN"
        :idea-count="ideaCount"
        :idea-counter-class="ideaCounterClass"
        :style="style"
        :style-options="styleOptions"
        :style-hint="styleHint"
        :can-generate="canGenerate"
        :generating="suggestionsStore.generating"
        @input="onInput"
        @generate="onGenerate"
        @set-style="setStyle"
      />

      <FavoritesPanel
        :user="auth.user"
        :loading="fav.loading"
        :error="fav.error"
        :names="fav.names"
        :domains="fav.domains"
        @clear-all="fav.clearAll()"
        @remove="fav.removeFavorite"
      />

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
