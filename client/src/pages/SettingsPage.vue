<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { usePortfolioStore } from '../stores/portfolio.js'

const auth = useAuthStore()
const portfolioStore = usePortfolioStore()

const STORAGE_KEY = 'lw-settings'
const defaults = { theme: 'dark', language: 'fr', currency: 'USD', defaultMode: 'demo', chartType: 'line' }
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || defaults
const settings = ref({ ...defaults, ...saved })

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

// Apply saved theme on load
applyTheme(settings.value.theme)

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  applyTheme(settings.value.theme)
  saveMsg.value = 'Preferences sauvegardees'
  setTimeout(() => saveMsg.value = '', 2000)
}

const saveMsg = ref('')
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h1>Parametres</h1>
      <p class="subtitle">Preferences et configuration du compte</p>
    </header>

    <div class="settings-grid">
      <div class="settings-section">
        <h2>Compte</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Nom d'utilisateur</span>
            <span class="setting-value">{{ auth.user?.username }}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Email</span>
            <span class="setting-value">{{ auth.user?.email }}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Membre depuis</span>
            <span class="setting-value">{{ new Date(auth.user?.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Mode actif</span>
            <span class="setting-value mode-val" :class="portfolioStore.mode">{{ portfolioStore.mode === 'demo' ? 'Demo' : 'Live' }}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Apparence</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Theme</span>
            <span class="setting-desc">Choix du theme de l'interface</span>
          </div>
          <select v-model="settings.theme" class="setting-select" @change="save">
            <option value="dark">Sombre</option>
            <option value="light">Clair</option>
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Langue</span>
            <span class="setting-desc">Langue de l'interface</span>
          </div>
          <select v-model="settings.language" class="setting-select" @change="save">
            <option value="fr">Francais</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Devise</span>
            <span class="setting-desc">Devise d'affichage</span>
          </div>
          <select v-model="settings.currency" class="setting-select" @change="save">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h2>Trading</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Mode par defaut</span>
            <span class="setting-desc">Mode de trading au lancement</span>
          </div>
          <select v-model="settings.defaultMode" class="setting-select" @change="save">
            <option value="demo">Demo</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Type de graphique</span>
            <span class="setting-desc">Graphique par defaut</span>
          </div>
          <select v-model="settings.chartType" class="setting-select" @change="save">
            <option value="line">Ligne</option>
            <option value="candle">Bougies</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h2>Securite</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Mot de passe</span>
            <span class="setting-desc">Modifier votre mot de passe</span>
          </div>
          <button class="setting-action" disabled>Modifier</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Sessions</span>
            <span class="setting-desc">Gerer les sessions actives</span>
          </div>
          <button class="setting-action" disabled>Gerer</button>
        </div>
      </div>
    </div>

    <p v-if="saveMsg" class="save-msg">{{ saveMsg }}</p>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 28px; }
.page-header h1 { font-size: 28px; font-weight: 700; }
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.settings-grid { display: flex; flex-direction: column; gap: 24px; max-width: 700px; }

.settings-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 20px 24px; }
.settings-section h2 { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; }

.setting-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
.setting-row:last-child { border-bottom: none; }
.setting-info { flex: 1; }
.setting-label { display: block; font-size: 14px; font-weight: 500; color: var(--text-primary); }
.setting-value { font-size: 13px; color: var(--text-secondary); margin-top: 2px; display: block; }
.setting-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: block; }

.mode-val.demo { color: var(--accent); }
.mode-val.live { color: var(--green); }

.setting-select { padding: 6px 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 13px; outline: none; cursor: pointer; }
.setting-select:focus { border-color: var(--accent); }

.setting-action { padding: 6px 16px; background: transparent; border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.setting-action:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.setting-action:disabled { opacity: 0.4; cursor: not-allowed; }

.save-msg { color: var(--green); font-size: 13px; margin-top: 16px; }
</style>
