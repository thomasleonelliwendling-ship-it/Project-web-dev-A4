<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { usePortfolioStore } from '../stores/portfolio.js'

const auth = useAuthStore()
const portfolioStore = usePortfolioStore()
const router = useRouter()
const showUserMenu = ref(false)

function switchMode(newMode) {
  portfolioStore.setMode(newMode)
  if (auth.isAuthenticated) {
    portfolioStore.fetchPortfolio()
  }
}

async function handleLogout() {
  await auth.logout()
  showUserMenu.value = false
  router.push('/login')
}
</script>

<template>
  <nav class="sidebar">
    <div class="logo">
      <div class="logo-mark">
        <span class="logo-l">L</span>
        <span class="logo-dash">-</span>
        <span class="logo-w">W</span>
      </div>
      <span class="logo-text">L-W Trade</span>
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

    <div v-if="auth.isAuthenticated && portfolioStore.portfolio" class="balance-display">
      <div class="balance-header">
        <span class="balance-label">Solde disponible</span>
        <button class="add-funds-mini" @click="$router.push('/portfolio')" title="Ajouter des fonds">+</button>
      </div>
      <span class="balance-value">${{ portfolioStore.portfolio.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
      <span class="balance-total">Total: ${{ portfolioStore.portfolio.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
    </div>

    <div class="nav-links">
      <router-link to="/" class="nav-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Dashboard
      </router-link>
      <template v-if="auth.isAuthenticated">
        <router-link to="/portfolio" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          Portfolio
        </router-link>
        <router-link to="/transactions" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Transactions
        </router-link>
      </template>
    </div>

    <div class="nav-footer" v-if="auth.isAuthenticated">
      <div class="user-card" @click="showUserMenu = !showUserMenu">
        <div class="user-avatar">{{ auth.user?.username?.charAt(0)?.toUpperCase() }}</div>
        <div class="user-details">
          <span class="user-name">{{ auth.user?.username }}</span>
          <span class="user-email">{{ auth.user?.email }}</span>
        </div>
        <svg class="chevron" :class="{ open: showUserMenu }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <div v-if="showUserMenu" class="user-menu">
        <div class="menu-info">
          <span class="menu-label">Email</span>
          <span class="menu-value">{{ auth.user?.email }}</span>
        </div>
        <div class="menu-info">
          <span class="menu-label">Mode</span>
          <span class="menu-value mode-val" :class="portfolioStore.mode">{{ portfolioStore.mode === 'demo' ? 'Demo Trade' : 'Live Trade' }}</span>
        </div>
        <div class="menu-info">
          <span class="menu-label">Solde</span>
          <span class="menu-value">${{ portfolioStore.portfolio?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}</span>
        </div>
        <div class="menu-info">
          <span class="menu-label">Membre depuis</span>
          <span class="menu-value">{{ new Date(auth.user?.createdAt).toLocaleDateString('fr-FR') }}</span>
        </div>
        <div class="menu-divider"></div>
        <button class="menu-btn" @click="$router.push('/portfolio'); showUserMenu = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/></svg>
          Mon portefeuille
        </button>
        <button class="menu-btn logout" @click="handleLogout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Deconnexion
        </button>
      </div>
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
  width: 240px;
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
  gap: 12px;
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--border);
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent), #e8830e);
  border-radius: 8px;
  font-weight: 900;
  font-size: 11px;
  color: #000;
  letter-spacing: -0.5px;
}

.logo-dash {
  margin: 0 -1px;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.mode-toggle {
  display: flex;
  margin: 16px 16px 0;
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
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mode-btn.active {
  background: var(--accent);
  color: #000;
}

.mode-btn.live.active {
  background: var(--green);
  color: #fff;
}

.balance-display {
  margin: 14px 16px 0;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.balance-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-funds-mini {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(38, 166, 154, 0.15);
  border: 1px solid rgba(38, 166, 154, 0.3);
  color: var(--green);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.add-funds-mini:hover {
  background: rgba(38, 166, 154, 0.3);
}

.balance-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.balance-total {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.nav-links {
  flex: 1;
  padding: 16px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
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

.nav-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.04);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent), #e8830e);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  transition: transform 0.2s;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

.user-menu {
  margin-top: 8px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.menu-info {
  margin-bottom: 10px;
}

.menu-label {
  display: block;
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.menu-value {
  font-size: 12px;
  color: var(--text-primary);
}

.menu-divider {
  height: 1px;
  background: var(--border);
  margin: 10px 0;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.menu-btn.logout:hover {
  color: var(--red);
  background: rgba(239, 83, 80, 0.08);
}

.mode-val.demo { color: var(--accent); }
.mode-val.live { color: var(--green); }

.login-btn {
  display: block;
  width: 100%;
  padding: 10px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 8px;
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
