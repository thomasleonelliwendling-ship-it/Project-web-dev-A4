<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePortfolioStore } from '../stores/portfolio.js'

const portfolioStore = usePortfolioStore()
const depositAmount = ref('')
const depositMsg = ref('')
const resetMsg = ref('')
const showDeposit = ref(false)

onMounted(() => {
  portfolioStore.fetchPortfolio()
})

watch(() => portfolioStore.mode, () => {
  portfolioStore.fetchPortfolio()
})

async function handleResetDemo() {
  if (!confirm('Reinitialiser le portfolio demo ? Toutes les positions et transactions seront supprimees.')) return
  const data = await portfolioStore.resetDemo()
  resetMsg.value = data.message
  setTimeout(() => resetMsg.value = '', 3000)
}

async function handleDeposit() {
  const amount = Number(depositAmount.value)
  if (!amount || amount < 1) return
  const data = await portfolioStore.deposit(amount)
  depositMsg.value = data.message
  depositAmount.value = ''
  showDeposit.value = false
  setTimeout(() => depositMsg.value = '', 3000)
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function formatChange(val) {
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
}
</script>

<template>
  <div class="portfolio">
    <header class="page-header">
      <div class="header-row">
        <div>
          <h1>Portfolio <span class="mode-badge" :class="portfolioStore.mode">{{ portfolioStore.mode === 'demo' ? 'Demo Trade' : 'Live Trade' }}</span></h1>
          <p class="subtitle">{{ portfolioStore.mode === 'demo' ? 'Tradez avec $100,000 virtuels' : 'Trading avec de l\'argent reel' }}</p>
        </div>
        <div class="header-actions">
          <button v-if="portfolioStore.mode === 'demo'" class="action-btn reset" @click="handleResetDemo">Reinitialiser</button>
          <button v-if="portfolioStore.mode === 'live'" class="action-btn deposit" @click="showDeposit = !showDeposit">Deposer</button>
        </div>
      </div>
      <p v-if="resetMsg" class="action-msg">{{ resetMsg }}</p>
      <p v-if="depositMsg" class="action-msg">{{ depositMsg }}</p>

      <div v-if="showDeposit" class="deposit-form">
        <input v-model="depositAmount" type="number" min="1" placeholder="Montant en $" class="deposit-input" />
        <button class="action-btn deposit" @click="handleDeposit">Confirmer le depot</button>
      </div>
    </header>

    <div v-if="portfolioStore.loading" class="loading">Chargement...</div>

    <template v-else-if="portfolioStore.portfolio">
      <div class="summary-cards">
        <div class="summary-card">
          <span class="card-label">Valeur totale</span>
          <span class="card-value">{{ formatPrice(portfolioStore.portfolio.totalValue) }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Liquidites</span>
          <span class="card-value">{{ formatPrice(portfolioStore.portfolio.balance) }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Valeur des positions</span>
          <span class="card-value">{{ formatPrice(portfolioStore.portfolio.totalMarketValue) }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Positions ouvertes</span>
          <span class="card-value">{{ portfolioStore.portfolio.holdings.length }}</span>
        </div>
      </div>

      <div class="holdings-section" v-if="portfolioStore.portfolio.holdings.length">
        <h2>Positions</h2>
        <table class="holdings-table">
          <thead>
            <tr>
              <th>Symbole</th>
              <th>Quantite</th>
              <th>Prix moyen</th>
              <th>Prix actuel</th>
              <th>Valeur</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in portfolioStore.portfolio.holdings" :key="h.symbol">
              <td>
                <router-link :to="`/stock/${h.symbol}`" class="symbol-link">{{ h.symbol }}</router-link>
              </td>
              <td>{{ h.quantity }}</td>
              <td>{{ formatPrice(h.averageCost) }}</td>
              <td>{{ formatPrice(h.currentPrice) }}</td>
              <td>{{ formatPrice(h.marketValue) }}</td>
              <td :class="h.gainLoss >= 0 ? 'positive' : 'negative'">
                {{ formatChange(h.gainLoss) }} ({{ formatChange(h.gainLossPercent) }}%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <p>Aucune position ouverte</p>
        <router-link to="/" class="cta-link">Parcourir les actions</router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.mode-badge {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  vertical-align: middle;
}

.mode-badge.demo {
  background: rgba(247, 147, 26, 0.15);
  color: var(--accent);
}

.mode-badge.live {
  background: rgba(38, 166, 154, 0.15);
  color: var(--green);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.reset:hover {
  border-color: var(--red);
  color: var(--red);
}

.action-btn.deposit {
  background: var(--green);
  border-color: var(--green);
  color: #fff;
}

.action-btn.deposit:hover {
  opacity: 0.9;
}

.action-msg {
  color: var(--green);
  font-size: 13px;
  margin-top: 8px;
}

.deposit-form {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}

.deposit-input {
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  width: 160px;
  outline: none;
}

.deposit-input:focus {
  border-color: var(--accent);
}

.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.card-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
}

.holdings-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
}

.holdings-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
}

.holdings-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.holdings-table td {
  padding: 14px 12px;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}

.holdings-table tr:last-child td {
  border-bottom: none;
}

.symbol-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.symbol-link:hover {
  text-decoration: underline;
}

.positive { color: var(--green); }
.negative { color: var(--red); }

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-secondary);
}

.cta-link {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--accent);
  color: #000;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
}

.cta-link:hover {
  opacity: 0.9;
}
</style>
