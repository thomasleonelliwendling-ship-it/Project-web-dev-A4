<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePortfolioStore } from '../stores/portfolio.js'

const portfolioStore = usePortfolioStore()
const depositAmount = ref('')
const depositMsg = ref('')
const resetMsg = ref('')
const showDeposit = ref(false)
const sellModal = ref(null)
const sellQty = ref(1)
const sellMsg = ref('')
const sellError = ref('')
const sellLoading = ref(false)

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

function openSellModal(holding) {
  sellModal.value = holding
  sellQty.value = 1
  sellMsg.value = ''
  sellError.value = ''
}

async function handleQuickSell() {
  if (!sellModal.value || sellQty.value < 1) return
  sellLoading.value = true
  sellError.value = ''
  try {
    const data = await portfolioStore.sellStock(sellModal.value.symbol, sellQty.value)
    sellMsg.value = data.message
    setTimeout(() => { sellModal.value = null; sellMsg.value = '' }, 2000)
  } catch (e) {
    sellError.value = e.message
  } finally {
    sellLoading.value = false
  }
}

function sellAll(holding) {
  sellModal.value = holding
  sellQty.value = holding.quantity
  sellMsg.value = ''
  sellError.value = ''
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
        </div>
      </div>
      <p v-if="resetMsg" class="action-msg">{{ resetMsg }}</p>
    </header>

    <div v-if="portfolioStore.loading" class="loading">Chargement...</div>

    <template v-else-if="portfolioStore.portfolio">
      <div class="summary-cards">
        <div class="summary-card accent">
          <span class="card-label">Valeur totale</span>
          <span class="card-value">{{ formatPrice(portfolioStore.portfolio.totalValue) }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Liquidites</span>
          <span class="card-value">{{ formatPrice(portfolioStore.portfolio.balance) }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Positions</span>
          <span class="card-value">{{ formatPrice(portfolioStore.portfolio.totalMarketValue) }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Positions ouvertes</span>
          <span class="card-value">{{ portfolioStore.portfolio.holdings.length }}</span>
        </div>
      </div>

      <div class="holdings-section" v-if="portfolioStore.portfolio.holdings.length">
        <h2>Positions ouvertes</h2>
        <table class="holdings-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Qte</th>
              <th>PRU</th>
              <th>Cours</th>
              <th>Valeur</th>
              <th>P&amp;L</th>
              <th>Actions</th>
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
              <td class="actions-cell">
                <button class="sell-btn" @click="openSellModal(h)">Vendre</button>
                <button class="close-pos-btn" @click="sellAll(h)" title="Fermer la position">Fermer</button>
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

    <!-- Sell modal -->
    <div v-if="sellModal" class="modal-overlay" @click.self="sellModal = null">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Vendre {{ sellModal.symbol }}</h3>
          <button class="close-btn" @click="sellModal = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-info-row">
            <span>Position actuelle</span>
            <span>{{ sellModal.quantity }} actions</span>
          </div>
          <div class="modal-info-row">
            <span>Prix actuel</span>
            <span>{{ formatPrice(sellModal.currentPrice) }}</span>
          </div>
          <div class="modal-info-row" :class="sellModal.gainLoss >= 0 ? 'positive' : 'negative'">
            <span>P&amp;L</span>
            <span>{{ formatChange(sellModal.gainLoss) }} ({{ formatChange(sellModal.gainLossPercent) }}%)</span>
          </div>
          <div class="form-group">
            <label>Quantite a vendre</label>
            <input v-model.number="sellQty" type="number" min="1" :max="sellModal.quantity" />
          </div>
          <div class="modal-info-row total">
            <span>Produit de la vente</span>
            <span>{{ formatPrice(sellModal.currentPrice * sellQty) }}</span>
          </div>
          <p v-if="sellError" class="error-msg">{{ sellError }}</p>
          <p v-if="sellMsg" class="success-msg">{{ sellMsg }}</p>
          <div class="modal-actions">
            <button class="modal-sell-btn" @click="handleQuickSell" :disabled="sellLoading || sellQty < 1 || sellQty > sellModal.quantity">
              {{ sellLoading ? 'En cours...' : `Vendre ${sellQty} ${sellModal.symbol}` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 28px; }
.page-header h1 { font-size: 28px; font-weight: 700; }
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; }

.mode-badge { font-size: 13px; padding: 4px 10px; border-radius: 6px; font-weight: 600; vertical-align: middle; }
.mode-badge.demo { background: rgba(247, 147, 26, 0.15); color: var(--accent); }
.mode-badge.live { background: rgba(38, 166, 154, 0.15); color: var(--green); }

.header-actions { display: flex; gap: 8px; }
.action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.action-btn.funds { background: var(--green); border-color: var(--green); color: #fff; }
.action-btn.funds:hover { opacity: 0.9; }
.action-btn.reset:hover { border-color: var(--red); color: var(--red); }

.action-msg { color: var(--green); font-size: 13px; margin-top: 8px; }

.deposit-panel { margin-top: 16px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; }
.deposit-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.close-btn { background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; }
.card-row { display: flex; gap: 6px; margin-bottom: 12px; }
.card-badge { padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
.card-badge.visa { background: #1a1f71; color: #fff; }
.card-badge.mc { background: #eb001b; color: #fff; }
.card-badge.cb { background: var(--green); color: #fff; }
.quick-amounts { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.amt-btn { padding: 6px 14px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.amt-btn:hover { border-color: var(--accent); color: var(--accent); }
.deposit-row { display: flex; gap: 8px; }
.deposit-input { flex: 1; padding: 8px 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px; outline: none; }
.deposit-input:focus { border-color: var(--accent); }
.confirm-btn { padding: 8px 20px; background: var(--green); border: none; border-radius: 6px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.confirm-btn:hover { opacity: 0.9; }

.loading { text-align: center; color: var(--text-secondary); padding: 60px; }

.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.summary-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
.summary-card.accent { border-color: rgba(247, 147, 26, 0.3); }
.card-label { display: block; font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.card-value { font-size: 22px; font-weight: 700; }

.holdings-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 24px; }
.holdings-section h2 { font-size: 16px; margin-bottom: 16px; color: var(--text-secondary); }
.holdings-table { width: 100%; border-collapse: collapse; }
.holdings-table th { text-align: left; padding: 10px 12px; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
.holdings-table td { padding: 12px; font-size: 14px; border-bottom: 1px solid var(--border); }
.holdings-table tr:last-child td { border-bottom: none; }
.holdings-table tr:hover { background: rgba(255,255,255,0.02); }
.symbol-link { color: var(--accent); text-decoration: none; font-weight: 600; }
.symbol-link:hover { text-decoration: underline; }
.positive { color: var(--green); }
.negative { color: var(--red); }

.actions-cell { display: flex; gap: 6px; }
.sell-btn { padding: 5px 12px; background: rgba(239, 83, 80, 0.12); border: 1px solid rgba(239, 83, 80, 0.3); border-radius: 6px; color: var(--red); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.sell-btn:hover { background: rgba(239, 83, 80, 0.25); }
.close-pos-btn { padding: 5px 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.close-pos-btn:hover { border-color: var(--red); color: var(--red); }

.empty-state { text-align: center; padding: 60px; color: var(--text-secondary); }
.cta-link { display: inline-block; margin-top: 16px; padding: 10px 24px; background: var(--accent); color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
.cta-link:hover { opacity: 0.9; }

/* Sell Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-box { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 400px; max-width: 90vw; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { font-size: 18px; font-weight: 700; }
.modal-body .form-group { margin: 14px 0; }
.modal-body .form-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.modal-body .form-group input { width: 100%; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; }
.modal-body .form-group input:focus { border-color: var(--accent); }
.modal-info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
.modal-info-row.total { color: var(--text-primary); font-weight: 600; font-size: 15px; }
.modal-actions { margin-top: 16px; }
.modal-sell-btn { width: 100%; padding: 12px; background: var(--red); border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
.modal-sell-btn:hover { opacity: 0.9; }
.modal-sell-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-msg { color: var(--red); font-size: 13px; margin: 8px 0; }
.success-msg { color: var(--green); font-size: 13px; margin: 8px 0; }
</style>
