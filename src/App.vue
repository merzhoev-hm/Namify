<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'

const auth = useAuthStore()

onMounted(() => {
  auth.me().catch(() => {})
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950">
    <!-- Шапка -->
    <Header />
    <!-- Контент -->
    <main class="p-6">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<style></style>
