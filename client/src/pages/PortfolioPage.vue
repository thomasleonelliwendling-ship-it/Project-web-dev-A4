<script setup>
import { onMounted } from 'vue'
import { usePortfolioStore } from '../stores/portfolio.js'

const portfolioStore = usePortfolioStore()

onMounted(() => {
  portfolioStore.fetchPortfolio()
})

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
      <h1>Portfolio</h1>
      <p class="subtitle">Vue d'ensemble de vos positions</p>
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
