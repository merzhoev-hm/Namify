<script setup lang="ts"></script>
<template>
  <footer class="bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-gray-300 py-8 mt-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between gap-8 px-4">
        <!-- Лого -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Namify</h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Генератор уникальных названий и идей ✨
          </p>
        </div>

        <!-- Контакты -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Контакты
          </h3>
          <ul class="mt-4 space-y-2">
            <li class="flex items-center gap-2">
              <Mail class="w-4 h-4" />
              <a
                href="mailto:namify@mail.ru"
                class="hover:text-gray-900 dark:hover:text-white transition"
              >
                namify@mail.ru
              </a>
            </li>
            <li class="flex items-center gap-2">
              <Send class="w-4 h-4" />
              <a
                href="#"
                target="_blank"
                class="hover:text-gray-900 dark:hover:text-white transition"
              >
                Telegram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Копирайт -->
      <div
        class="mt-8 border-t border-gray-300 dark:border-gray-700 pt-4 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        © 2025 Namify. Все права защищены.
      </div>
    </div>
  </footer>
</template>
