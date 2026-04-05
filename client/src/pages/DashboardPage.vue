<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStocksStore } from '../stores/stocks.js'
import { usePortfolioStore } from '../stores/portfolio.js'
import { useAuthStore } from '../stores/auth.js'

const stocksStore = useStocksStore()
const portfolioStore = usePortfolioStore()
const auth = useAuthStore()

onMounted(() => {
  stocksStore.fetchStocks()
  if (auth.isAuthenticated) {
    portfolioStore.fetchPortfolio()
  }
})

const topGainers = computed(() =>
  [...(stocksStore.stocks || [])].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3),
)

const topLosers = computed(() =>
  [...(stocksStore.stocks || [])].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3),
)

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function formatChange(val) {
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
}

const activeFilter = ref('all')

const filteredStocks = computed(() => {
  const stocks = stocksStore.stocks || []
  if (activeFilter.value === 'all') return stocks
  return stocks.filter(s => s.type === activeFilter.value)
})

function formatPct(val) {
  return val >= 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`
}
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>Marche</h1>
      <p class="subtitle">Actions majeures en temps reel</p>
    </header>

    <!-- Portfolio overview for logged-in users -->
    <div v-if="auth.isAuthenticated && portfolioStore.portfolio" class="account-bar">
      <div class="account-stat">
        <span class="stat-label">Valeur totale</span>
        <span class="stat-num">{{ formatPrice(portfolioStore.portfolio.totalValue) }}</span>
      </div>
      <div class="account-stat">
        <span class="stat-label">Liquidites</span>
        <span class="stat-num">{{ formatPrice(portfolioStore.portfolio.balance) }}</span>
      </div>
      <div class="account-stat">
        <span class="stat-label">Positions</span>
        <span class="stat-num">{{ portfolioStore.portfolio.holdings.length }}</span>
      </div>
      <div class="account-stat" v-if="portfolioStore.portfolio.holdings.length">
        <span class="stat-label">P&amp;L total</span>
        <span class="stat-num" :class="portfolioStore.portfolio.holdings.reduce((s, h) => s + h.gainLoss, 0) >= 0 ? 'positive' : 'negative'">
          {{ formatPrice(portfolioStore.portfolio.holdings.reduce((s, h) => s + h.gainLoss, 0)) }}
        </span>
      </div>
    </div>

    <div v-if="stocksStore.loading" class="loading">Chargement...</div>

    <template v-else>
      <!-- Top movers -->
      <div class="movers-row">
        <div class="mover-card">
          <h3 class="mover-title gain-title">Top Hausse</h3>
          <div v-for="s in topGainers" :key="s.symbol" class="mover-item">
            <router-link :to="`/stock/${s.symbol}`" class="mover-link">
              <img v-if="s.logo" :src="s.logo" class="mover-logo" @error="$event.target.style.display = 'none'" />
              <span class="mover-sym">{{ s.symbol }}</span>
            </router-link>
            <span class="mover-price">{{ formatPrice(s.currentPrice) }}</span>
            <span class="mover-pct positive">{{ formatPct(s.changePercent) }}</span>
          </div>
        </div>
        <div class="mover-card">
          <h3 class="mover-title loss-title">Top Baisse</h3>
          <div v-for="s in topLosers" :key="s.symbol" class="mover-item">
            <router-link :to="`/stock/${s.symbol}`" class="mover-link">
              <img v-if="s.logo" :src="s.logo" class="mover-logo" @error="$event.target.style.display = 'none'" />
              <span class="mover-sym">{{ s.symbol }}</span>
            </router-link>
            <span class="mover-price">{{ formatPrice(s.currentPrice) }}</span>
            <span class="mover-pct negative">{{ formatPct(s.changePercent) }}</span>
          </div>
        </div>
      </div>

      <!-- All stocks -->
      <div class="filter-bar">
        <button class="filter-btn" :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">Tous</button>
        <button class="filter-btn" :class="{ active: activeFilter === 'stock' }" @click="activeFilter = 'stock'">Actions</button>
        <button class="filter-btn" :class="{ active: activeFilter === 'crypto' }" @click="activeFilter = 'crypto'">Crypto</button>
        <button class="filter-btn" :class="{ active: activeFilter === 'etf' }" @click="activeFilter = 'etf'">Indices / ETF</button>
      </div>
      <div class="stocks-grid">
        <router-link
          v-for="stock in filteredStocks"
          :key="stock.symbol"
          :to="`/stock/${stock.symbol}`"
          class="stock-card"
        >
          <div class="stock-header">
            <div class="stock-info">
              <img v-if="stock.logo" :src="stock.logo" :alt="stock.symbol" class="stock-logo" @error="$event.target.style.display = 'none'" />
              <div>
                <span class="stock-symbol">{{ stock.symbol }}</span>
                <span class="stock-name">{{ stock.name }}</span>
              </div>
            </div>
            <span class="stock-sector">{{ stock.sector }}</span>
          </div>
          <div class="stock-price-row">
            <span class="stock-price">{{ formatPrice(stock.currentPrice) }}</span>
            <span class="stock-change" :class="stock.change >= 0 ? 'positive' : 'negative'">
              {{ formatChange(stock.change) }} ({{ formatPct(stock.changePercent) }})
            </span>
          </div>
        </router-link>
      </div>

      <!-- Open positions preview -->
      <div v-if="auth.isAuthenticated && portfolioStore.portfolio?.holdings?.length" class="positions-preview">
        <h2 class="section-title">Positions ouvertes</h2>
        <div class="positions-list">
          <router-link v-for="h in portfolioStore.portfolio.holdings" :key="h.symbol" :to="`/stock/${h.symbol}`" class="pos-row">
            <span class="pos-sym">{{ h.symbol }}</span>
            <span class="pos-qty">{{ h.quantity }} actions</span>
            <span class="pos-val">{{ formatPrice(h.marketValue) }}</span>
            <span class="pos-pnl" :class="h.gainLoss >= 0 ? 'positive' : 'negative'">{{ formatChange(h.gainLoss) }}</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 700; }
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.account-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.account-stat { flex: 1; }
.stat-label { display: block; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.stat-num { font-size: 20px; font-weight: 700; }
.stat-num.positive { color: var(--green); }
.stat-num.negative { color: var(--red); }

.movers-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
.mover-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
.mover-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; font-weight: 600; }
.gain-title { color: var(--green); }
.loss-title { color: var(--red); }
.mover-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.mover-item:last-child { border-bottom: none; }
.mover-link { display: flex; align-items: center; gap: 8px; text-decoration: none; flex: 1; }
.mover-logo { width: 24px; height: 24px; border-radius: 4px; background: #fff; padding: 1px; object-fit: contain; }
.mover-sym { font-weight: 700; font-size: 14px; color: var(--text-primary); }
.mover-price { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.mover-pct { font-size: 13px; font-weight: 600; min-width: 70px; text-align: right; }

.section-title { font-size: 16px; font-weight: 600; color: var(--text-secondary); margin-bottom: 16px; }

.filter-bar { display: flex; gap: 6px; margin-bottom: 16px; }
.filter-btn { padding: 6px 16px; background: transparent; border: 1px solid var(--border); border-radius: 20px; color: var(--text-secondary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.filter-btn:hover { color: var(--text-primary); border-color: var(--text-secondary); }
.filter-btn.active { background: var(--accent); border-color: var(--accent); color: #000; font-weight: 600; }

.loading { text-align: center; color: var(--text-secondary); padding: 60px; }

.stocks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-bottom: 28px; }
.stock-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 18px; text-decoration: none; color: inherit; transition: all 0.15s; }
.stock-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

.stock-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.stock-info { display: flex; align-items: center; gap: 10px; }
.stock-logo { width: 32px; height: 32px; border-radius: 6px; object-fit: contain; background: #fff; padding: 2px; }
.stock-symbol { font-size: 17px; font-weight: 700; margin-right: 6px; }
.stock-name { font-size: 12px; color: var(--text-secondary); }
.stock-sector { font-size: 11px; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px; }
.stock-price-row { display: flex; justify-content: space-between; align-items: center; }
.stock-price { font-size: 20px; font-weight: 600; }
.stock-change { font-size: 13px; font-weight: 600; }
.positive { color: var(--green); }
.negative { color: var(--red); }

.positions-preview { margin-bottom: 28px; }
.positions-list { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.pos-row { display: flex; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; transition: background 0.1s; }
.pos-row:last-child { border-bottom: none; }
.pos-row:hover { background: rgba(255,255,255,0.03); }
.pos-sym { font-weight: 700; font-size: 14px; color: var(--accent); width: 70px; }
.pos-qty { flex: 1; font-size: 13px; color: var(--text-secondary); }
.pos-val { font-size: 14px; font-weight: 600; margin-right: 16px; }
.pos-pnl { font-size: 13px; font-weight: 600; min-width: 80px; text-align: right; }
</style>
