<script setup>
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import AppNav from './components/AppNav.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isAuthPage = computed(() => route.meta.guest === true)

onMounted(async () => {
  await auth.fetchUser()
})
</script>

<template>
  <div class="app">
    <AppNav v-if="!isAuthPage" />
    <main class="main-content" :class="{ 'no-nav': isAuthPage }">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #131722;
  --bg-card: #1a1f2e;
  --bg-input: #1e2235;
  --text-primary: #d1d4dc;
  --text-secondary: #787b86;
  --accent: #f7931a;
  --green: #26a69a;
  --red: #ef5350;
  --border: #2a2e39;
  --blue: #2962ff;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 24px;
}

.main-content.no-nav {
  margin-left: 0;
}
</style>
