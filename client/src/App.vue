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
  // Apply saved theme
  const saved = JSON.parse(localStorage.getItem('lw-settings') || '{}')
  if (saved.theme) document.documentElement.setAttribute('data-theme', saved.theme)
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

:root,
[data-theme="dark"] {
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

[data-theme="light"] {
  --bg-primary: #f5f5f8;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-input: #f0f1f3;
  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --accent: #e8830e;
  --green: #16a34a;
  --red: #dc2626;
  --border: #e5e7eb;
  --blue: #2563eb;
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
  margin-left: 240px;
  padding: 24px;
}

.main-content.no-nav {
  margin-left: 0;
}
</style>
