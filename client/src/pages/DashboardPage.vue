<script setup>
import { onMounted } from 'vue'
import { useStocksStore } from '../stores/stocks.js'
import StockChart from '../components/StockChart.vue'

const stocksStore = useStocksStore()

onMounted(() => {
  stocksStore.fetchStocks()
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function formatChange(val) {
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
}
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>Marche</h1>
      <p class="subtitle">Actions majeures en temps reel</p>
    </header>

    <div v-if="stocksStore.loading" class="loading">Chargement...</div>

    <div v-else class="stocks-grid">
      <router-link
        v-for="stock in stocksStore.stocks"
        :key="stock.symbol"
        :to="`/stock/${stock.symbol}`"
        class="stock-card"
      >
        <div class="stock-header">
          <div class="stock-info">
            <img
              v-if="stock.logo"
              :src="stock.logo"
              :alt="stock.symbol"
              class="stock-logo"
              @error="$event.target.style.display = 'none'"
            />
            <div>
              <span class="stock-symbol">{{ stock.symbol }}</span>
              <span class="stock-name">{{ stock.name }}</span>
            </div>
          </div>
          <span class="stock-sector">{{ stock.sector }}</span>
        </div>

        <div class="stock-price-row">
          <span class="stock-price">{{ formatPrice(stock.currentPrice) }}</span>
          <span
            class="stock-change"
            :class="stock.change >= 0 ? 'positive' : 'negative'"
          >
            {{ formatChange(stock.change) }} ({{ formatChange(stock.changePercent) }}%)
          </span>
        </div>
      </router-link>
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

.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px;
}

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.stock-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}

.stock-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stock-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
  background: #fff;
  padding: 2px;
}

.stock-symbol {
  font-size: 18px;
  font-weight: 700;
  margin-right: 8px;
}

.stock-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.stock-sector {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
}

.stock-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-price {
  font-size: 22px;
  font-weight: 600;
}

.stock-change {
  font-size: 14px;
  font-weight: 500;
}

.stock-change.positive {
  color: var(--green);
}

.stock-change.negative {
  color: var(--red);
}
</style>
