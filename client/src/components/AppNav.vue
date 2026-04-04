<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { usePortfolioStore } from '../stores/portfolio.js'

const auth = useAuthStore()
const portfolioStore = usePortfolioStore()
const router = useRouter()

function switchMode(newMode) {
  portfolioStore.setMode(newMode)
  if (auth.isAuthenticated) {
    portfolioStore.fetchPortfolio()
  }
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="sidebar">
    <div class="logo">
      <span class="logo-icon">B</span>
      <span class="logo-text">TradeView</span>
    </div>

    <div v-if="auth.isAuthenticated" class="mode-toggle">
      <button
        class="mode-btn"
        :class="{ active: portfolioStore.mode === 'demo' }"
        @click="switchMode('demo')"
      >
        Demo
      </button>
      <button
        class="mode-btn live"
        :class="{ active: portfolioStore.mode === 'live' }"
        @click="switchMode('live')"
      >
        Live
      </button>
    </div>

    <div class="nav-links">
      <router-link to="/" class="nav-link">
        <span class="nav-icon">&#9632;</span> Dashboard
      </router-link>
      <template v-if="auth.isAuthenticated">
        <router-link to="/portfolio" class="nav-link">
          <span class="nav-icon">&#9670;</span> Portfolio
        </router-link>
        <router-link to="/transactions" class="nav-link">
          <span class="nav-icon">&#9654;</span> Transactions
        </router-link>
      </template>
    </div>

    <div class="nav-footer" v-if="auth.isAuthenticated">
      <div class="user-info">
        <span class="user-name">{{ auth.user?.username }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout">Deconnexion</button>
    </div>
    <div class="nav-footer" v-else>
      <router-link to="/login" class="login-btn">Connexion</router-link>
      <router-link to="/register" class="register-link">Creer un compte</router-link>
    </div>
  </nav>
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 220px;
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 24px;
  border-bottom: 1px solid var(--border);
}

.logo-icon {
  background: var(--accent);
  color: #000;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 18px;
  border-radius: 6px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.mode-toggle {
  display: flex;
  margin: 16px 14px 0;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 3px;
}

.mode-btn {
  flex: 1;
  padding: 7px 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn.active {
  background: var(--accent);
  color: #000;
}

.mode-btn.live.active {
  background: var(--green);
  color: #fff;
}

.nav-links {
  flex: 1;
  padding: 16px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
}

.nav-link:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}

.nav-link.router-link-exact-active {
  color: var(--accent);
  background: rgba(247, 147, 26, 0.08);
  border-right: 3px solid var(--accent);
}

.nav-icon {
  font-size: 10px;
}

.nav-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.user-info {
  margin-bottom: 12px;
}

.user-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.logout-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.logout-btn:hover {
  border-color: var(--red);
  color: var(--red);
}

.login-btn {
  display: block;
  width: 100%;
  padding: 10px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  transition: opacity 0.15s;
  margin-bottom: 8px;
}

.login-btn:hover {
  opacity: 0.9;
}

.register-link {
  display: block;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
}

.register-link:hover {
  color: var(--accent);
}
</style>
