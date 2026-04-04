<script setup>
import { onMounted } from 'vue'
import { usePortfolioStore } from '../stores/portfolio.js'

const portfolioStore = usePortfolioStore()

onMounted(() => {
  portfolioStore.fetchTransactions()
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="transactions">
    <header class="page-header">
      <h1>Transactions</h1>
      <p class="subtitle">Historique de vos ordres</p>
    </header>

    <div class="transactions-section" v-if="portfolioStore.transactions.length">
      <table class="tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Symbole</th>
            <th>Quantite</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in portfolioStore.transactions" :key="tx._id">
            <td class="date-cell">{{ formatDate(tx.createdAt) }}</td>
            <td>
              <span class="type-badge" :class="tx.type">
                {{ tx.type === 'buy' ? 'Achat' : 'Vente' }}
              </span>
            </td>
            <td>
              <router-link :to="`/stock/${tx.symbol}`" class="symbol-link">{{ tx.symbol }}</router-link>
            </td>
            <td>{{ tx.quantity }}</td>
            <td>{{ formatPrice(tx.price) }}</td>
            <td class="total-cell">{{ formatPrice(tx.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <p>Aucune transaction pour le moment</p>
      <router-link to="/" class="cta-link">Commencer a trader</router-link>
    </div>
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

.transactions-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
}

.tx-table {
  width: 100%;
  border-collapse: collapse;
}

.tx-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.tx-table td {
  padding: 14px 12px;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}

.tx-table tr:last-child td {
  border-bottom: none;
}

.date-cell {
  color: var(--text-secondary);
  font-size: 13px;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.buy {
  background: rgba(38, 166, 154, 0.15);
  color: var(--green);
}

.type-badge.sell {
  background: rgba(239, 83, 80, 0.15);
  color: var(--red);
}

.symbol-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.symbol-link:hover {
  text-decoration: underline;
}

.total-cell {
  font-weight: 600;
}

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
