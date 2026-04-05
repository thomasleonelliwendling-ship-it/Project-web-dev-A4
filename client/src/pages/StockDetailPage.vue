<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStocksStore } from '../stores/stocks.js'
import { usePortfolioStore } from '../stores/portfolio.js'
import { useAuthStore } from '../stores/auth.js'
import StockChart from '../components/StockChart.vue'
import TechnicalIndicators from '../components/TechnicalIndicators.vue'

const route = useRoute()
const stocksStore = useStocksStore()
const portfolioStore = usePortfolioStore()
const auth = useAuthStore()

const quantity = ref(1)
const tradeType = ref('buy')
const message = ref('')
const error = ref('')
const tradeLoading = ref(false)
const stopLoss = ref('')
const takeProfit = ref('')
const showAdvanced = ref(false)

const stock = computed(() => stocksStore.currentStock)

const totalCost = computed(() => {
  if (!stock.value) return 0
  return stock.value.currentPrice * quantity.value
})

onMounted(async () => {
  await stocksStore.fetchStock(route.params.symbol)
  if (auth.isAuthenticated) {
    await portfolioStore.fetchPortfolio()
  }
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function formatChange(val) {
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
}

async function handleTrade() {
  error.value = ''
  message.value = ''
  tradeLoading.value = true
  try {
    let data
    if (tradeType.value === 'buy') {
      data = await portfolioStore.buyStock(stock.value.symbol, quantity.value)
    } else {
      data = await portfolioStore.sellStock(stock.value.symbol, quantity.value)
    }
    message.value = data.message
  } catch (e) {
    error.value = e.message
  } finally {
    tradeLoading.value = false
  }
}
</script>

<template>
  <div class="stock-detail" v-if="stock">
    <div class="detail-header">
      <div class="detail-title">
        <img
          v-if="stock.logo"
          :src="stock.logo"
          :alt="stock.symbol"
          class="detail-logo"
          @error="$event.target.style.display = 'none'"
        />
        <div>
          <h1>{{ stock.symbol }} <span class="stock-name">{{ stock.name }}</span></h1>
          <span class="stock-sector">{{ stock.sector }}</span>
        </div>
      </div>
      <div class="price-block">
        <span class="current-price">{{ formatPrice(stock.currentPrice) }}</span>
        <span class="change" :class="stock.change >= 0 ? 'positive' : 'negative'">
          {{ formatChange(stock.change) }} ({{ formatChange(stock.changePercent) }}%)
        </span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="chart-section">
        <h2>Historique des prix</h2>
        <StockChart :price-history="stock.priceHistory" />
      </div>

      <div class="trade-section" v-if="auth.isAuthenticated">
        <h2>Passer un ordre</h2>

        <div class="trade-tabs">
          <button :class="{ active: tradeType === 'buy' }" @click="tradeType = 'buy'" class="tab-btn buy-tab">Acheter</button>
          <button :class="{ active: tradeType === 'sell' }" @click="tradeType = 'sell'" class="tab-btn sell-tab">Vendre</button>
        </div>

        <div class="trade-form">
          <div class="form-group">
            <label>Quantite</label>
            <input v-model.number="quantity" type="number" min="1" step="1" />
          </div>

          <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? 'Masquer' : 'Stop Loss / Take Profit' }}
            <svg :class="{ open: showAdvanced }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <div v-if="showAdvanced" class="advanced-fields">
            <div class="form-row">
              <div class="form-group half">
                <label>Stop Loss ($)</label>
                <input v-model.number="stopLoss" type="number" min="0" step="0.01" :placeholder="`ex: ${(stock.currentPrice * 0.95).toFixed(2)}`" />
              </div>
              <div class="form-group half">
                <label>Take Profit ($)</label>
                <input v-model.number="takeProfit" type="number" min="0" step="0.01" :placeholder="`ex: ${(stock.currentPrice * 1.1).toFixed(2)}`" />
              </div>
            </div>
            <p class="hint">Les ordres SL/TP sont indicatifs en mode demo</p>
          </div>

          <div class="trade-summary">
            <div class="summary-row">
              <span>Prix unitaire</span>
              <span>{{ formatPrice(stock.currentPrice) }}</span>
            </div>
            <div class="summary-row">
              <span>Quantite</span>
              <span>{{ quantity }}</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>{{ formatPrice(totalCost) }}</span>
            </div>
            <div class="summary-row" v-if="stopLoss">
              <span>Stop Loss</span>
              <span class="sl-val">{{ formatPrice(stopLoss) }}</span>
            </div>
            <div class="summary-row" v-if="takeProfit">
              <span>Take Profit</span>
              <span class="tp-val">{{ formatPrice(takeProfit) }}</span>
            </div>
          </div>

          <div class="balance-row" v-if="portfolioStore.portfolio">
            <span>Solde : {{ formatPrice(portfolioStore.portfolio.balance) }}</span>
            <router-link to="/portfolio" class="fund-link">+ Fonds</router-link>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
          <p v-if="message" class="success-msg">{{ message }}</p>

          <button @click="handleTrade" class="trade-btn" :class="tradeType" :disabled="tradeLoading || quantity < 1">
            {{ tradeLoading ? 'En cours...' : (tradeType === 'buy' ? 'Acheter' : 'Vendre') }} {{ stock.symbol }}
          </button>
        </div>
      </div>

      <div class="trade-section login-prompt" v-else>
        <h2>Passer un ordre</h2>
        <p class="prompt-text">Connectez-vous pour acheter et vendre des actions</p>
        <router-link to="/login" class="prompt-btn">Connexion</router-link>
        <p class="prompt-subtext">
          Pas encore de compte ?
          <router-link to="/register">Creer un compte</router-link>
        </p>
      </div>
    </div>

    <div class="price-stats">
      <h2>Statistiques</h2>
      <div class="stats-grid">
        <div class="stat">
          <span class="stat-label">Ouverture</span>
          <span class="stat-value">{{ formatPrice(stock.priceHistory[stock.priceHistory.length - 1]?.open) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Cloture precedente</span>
          <span class="stat-value">{{ formatPrice(stock.previousClose) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Plus haut (90j)</span>
          <span class="stat-value">{{ formatPrice(Math.max(...stock.priceHistory.map(p => p.high))) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Plus bas (90j)</span>
          <span class="stat-value">{{ formatPrice(Math.min(...stock.priceHistory.map(p => p.low))) }}</span>
        </div>
      </div>
    </div>
    <TechnicalIndicators :price-history="stock.priceHistory" />
  </div>

  <div v-else class="loading">Chargement...</div>
</template>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detail-logo {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: contain;
  background: #fff;
  padding: 3px;
}

.detail-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.stock-name {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
}

.stock-sector {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 4px;
  margin-top: 6px;
  display: inline-block;
}

.price-block {
  text-align: right;
}

.current-price {
  font-size: 32px;
  font-weight: 700;
  display: block;
}

.change {
  font-size: 15px;
  font-weight: 500;
}

.change.positive { color: var(--green); }
.change.negative { color: var(--red); }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  margin-bottom: 28px;
}

.chart-section, .trade-section, .price-stats {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
}

.chart-section h2, .trade-section h2, .price-stats h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.trade-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}

.buy-tab.active {
  background: rgba(38, 166, 154, 0.15);
  border-color: var(--green);
  color: var(--green);
}

.sell-tab.active {
  background: rgba(239, 83, 80, 0.15);
  border-color: var(--red);
  color: var(--red);
}

.trade-form .form-group {
  margin-bottom: 16px;
}

.trade-form label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.trade-form input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.trade-form input:focus {
  border-color: var(--accent);
}

.trade-summary {
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.summary-row.total {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 15px;
}

.error-msg {
  color: var(--red);
  font-size: 13px;
  margin-bottom: 12px;
}

.success-msg {
  color: var(--green);
  font-size: 13px;
  margin-bottom: 12px;
}

.trade-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.trade-btn.buy {
  background: var(--green);
  color: #fff;
}

.trade-btn.sell {
  background: var(--red);
  color: #fff;
}

.trade-btn:hover {
  opacity: 0.9;
}

.trade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.prompt-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}

.prompt-btn {
  display: inline-block;
  padding: 12px 32px;
  background: var(--accent);
  color: #000;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
  margin-bottom: 16px;
}

.prompt-btn:hover {
  opacity: 0.9;
}

.prompt-subtext {
  font-size: 13px;
  color: var(--text-secondary);
}

.prompt-subtext a {
  color: var(--accent);
  text-decoration: none;
}

.prompt-subtext a:hover {
  text-decoration: underline;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 6px;
  margin-bottom: 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.advanced-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.advanced-toggle svg {
  transition: transform 0.2s;
}

.advanced-toggle svg.open {
  transform: rotate(180deg);
}

.advanced-fields {
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-group.half {
  flex: 1;
}

.hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.sl-val { color: var(--red); }
.tp-val { color: var(--green); }

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.fund-link {
  color: var(--green);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.fund-link:hover {
  text-decoration: underline;
}
</style>
