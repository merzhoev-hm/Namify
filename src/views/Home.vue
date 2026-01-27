<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTldsStore } from '@/stores/tlds'
import { useSuggestionsStore } from '@/stores/suggestions'
import TldSelector from '@/components/TldSelector.vue'

// Сторы
const tlds = useTldsStore()
const suggestionsStore = useSuggestionsStore()

// Локальный стейт
const idea = ref('')
const MAX_IDEA_LEN = 100
const warning = ref('')

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
  suggestionsStore.generate(idea.value, [...tlds.selected])
}

// Следим за лимитом символов
function onInput() {
  warning.value = idea.value.length >= MAX_IDEA_LEN ? 'Достигнут лимит' : ''
}
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

        <input
          v-model="idea"
          @input="onInput"
          @keydown.enter.prevent="onGenerate"
          type="text"
          :maxlength="MAX_IDEA_LEN"
          placeholder="например: Махачкала кофе"
          class="w-full rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 mb-2"
        />

        <!-- TLD селектор -->
        <TldSelector :all="tlds.all" :selected="tlds.selected" @toggle="tlds.toggle" />

        <div class="mt-6 flex gap-3">
          <button
            @click="onGenerate"
            :disabled="!canGenerate || suggestionsStore.generating"
            class="w-full rounded-xl px-5 py-3 text-sm font-semibold border border-black dark:border-white hover:bg-gray-100/80 dark:hover:bg-zinc-800/70 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
          >
            {{ suggestionsStore.generating ? 'Генерирую...' : 'Сгенерировать' }}
          </button>
        </div>
      </div>

      <!-- Карточки -->
      <div class="mt-8 grid gap-4">
        <div
          v-for="(card, idx) in suggestionsStore.suggestions"
          :key="card.id"
          class="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 flex flex-col gap-3 border border-gray-100 dark:border-zinc-700 opacity-0 animate-fade-in-up"
          :style="{ animationDelay: `${idx * 120}ms`, animationFillMode: 'forwards' }"
        >
          <div class="flex items-center justify-between">
            <span class="font-semibold text-lg dark:text-white">{{ card.label }}</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ card.description }}</p>

          <button
            @click="card.open = !card.open"
            class="mt-1 self-start text-xs font-semibold inline-flex items-center gap-2 border border-black dark:border-white rounded-full px-3 py-2 hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
          >
            Показать варианты домена
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="h-4 w-4 transition-transform duration-300"
              :class="{ 'rotate-90': card.open }"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5l7 7-7 7"
              />
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
            <div v-if="card.open" class="mt-2 overflow-hidden">
              <div
                v-for="item in card.items"
                :key="item.fqdn"
                class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800"
              >
                <div class="text-sm font-medium">{{ item.fqdn }}</div>

                <div class="flex items-center gap-2">
                  <a
                    v-if="!item.checking && item.status === 'available'"
                    :href="item.registerUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs font-semibold px-3 py-1 rounded-full border border-black dark:border-white hover:bg-gray-100/90 dark:hover:bg-zinc-800/80"
                  >
                    Зарегистрировать домен
                  </a>

                  <span
                    class="text-xs font-semibold px-2 py-1 rounded-full"
                    :class="{
                      'bg-slate-500 text-white': item.checking,
                      'bg-emerald-500 text-white': !item.checking && item.status === 'available',
                      'bg-rose-500 text-white': !item.checking && item.status === 'taken',
                      'bg-gray-900 text-white dark:bg-white dark:text-black':
                        !item.checking && item.status === 'unknown',
                    }"
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
