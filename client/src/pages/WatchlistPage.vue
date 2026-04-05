<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStocksStore } from '../stores/stocks.js'

const stocksStore = useStocksStore()
const STORAGE_KEY = 'lw-watchlist'

const watchlist = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

onMounted(() => {
  stocksStore.fetchStocks()
})

function saveWatchlist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist.value))
}

function addSymbol(symbol) {
  if (!watchlist.value.includes(symbol)) {
    watchlist.value.push(symbol)
    saveWatchlist()
  }
}

function removeSymbol(symbol) {
  watchlist.value = watchlist.value.filter(s => s !== symbol)
  saveWatchlist()
}

function isWatched(symbol) {
  return watchlist.value.includes(symbol)
}

const watchedStocks = computed(() =>
  (stocksStore.stocks || []).filter(s => watchlist.value.includes(s.symbol)),
)

const availableStocks = computed(() =>
  (stocksStore.stocks || []).filter(s => !watchlist.value.includes(s.symbol)),
)

const showAdd = ref(false)

function formatPrice(p) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p)
}

function formatPct(v) {
  return v >= 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`
}
</script>

<template>
  <div class="watchlist-page">
    <header class="page-header">
      <div class="header-row">
        <div>
          <h1>Watchlist</h1>
          <p class="subtitle">Vos actions favorites</p>
        </div>
        <button class="add-btn" @click="showAdd = !showAdd">
          {{ showAdd ? 'Fermer' : '+ Ajouter' }}
        </button>
      </div>
    </header>

    <div v-if="showAdd" class="add-panel">
      <h3>Ajouter une action</h3>
      <div class="add-grid">
        <button v-for="s in availableStocks" :key="s.symbol" class="add-stock-btn" @click="addSymbol(s.symbol)">
          <img v-if="s.logo" :src="s.logo" class="add-logo" @error="$event.target.style.display = 'none'" />
          <span class="add-sym">{{ s.symbol }}</span>
          <span class="add-name">{{ s.name }}</span>
        </button>
      </div>
    </div>

    <div v-if="!watchedStocks.length && !stocksStore.loading" class="empty-state">
      <p>Aucune action dans votre watchlist</p>
      <button class="cta-btn" @click="showAdd = true">Ajouter des actions</button>
    </div>

    <div v-else class="watch-list">
      <router-link v-for="s in watchedStocks" :key="s.symbol" :to="`/stock/${s.symbol}`" class="watch-row">
        <div class="watch-left">
          <img v-if="s.logo" :src="s.logo" class="watch-logo" @error="$event.target.style.display = 'none'" />
          <div>
            <span class="watch-sym">{{ s.symbol }}</span>
            <span class="watch-name">{{ s.name }}</span>
          </div>
        </div>
        <div class="watch-right">
          <span class="watch-price">{{ formatPrice(s.currentPrice) }}</span>
          <span class="watch-pct" :class="s.changePercent >= 0 ? 'positive' : 'negative'">{{ formatPct(s.changePercent) }}</span>
          <button class="remove-btn" @click.prevent="removeSymbol(s.symbol)" title="Retirer">&times;</button>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 700; }
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.add-btn { padding: 8px 18px; background: var(--accent); border: none; border-radius: 8px; color: #000; font-size: 13px; font-weight: 600; cursor: pointer; }
.add-btn:hover { opacity: 0.9; }

.add-panel { margin-bottom: 24px; padding: 18px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; }
.add-panel h3 { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
.add-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.add-stock-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.add-stock-btn:hover { border-color: var(--accent); }
.add-logo { width: 20px; height: 20px; border-radius: 4px; background: #fff; padding: 1px; object-fit: contain; }
.add-sym { font-weight: 700; }
.add-name { color: var(--text-secondary); font-size: 12px; }

.empty-state { text-align: center; padding: 60px; color: var(--text-secondary); }
.cta-btn { margin-top: 16px; padding: 10px 24px; background: var(--accent); color: #000; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }

.watch-list { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.watch-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; transition: background 0.1s; }
.watch-row:last-child { border-bottom: none; }
.watch-row:hover { background: rgba(255,255,255,0.03); }
.watch-left { display: flex; align-items: center; gap: 12px; }
.watch-logo { width: 32px; height: 32px; border-radius: 6px; background: #fff; padding: 2px; object-fit: contain; }
.watch-sym { display: block; font-weight: 700; font-size: 15px; }
.watch-name { display: block; font-size: 12px; color: var(--text-secondary); }
.watch-right { display: flex; align-items: center; gap: 14px; }
.watch-price { font-size: 15px; font-weight: 600; }
.watch-pct { font-size: 13px; font-weight: 600; min-width: 70px; text-align: right; }
.positive { color: var(--green); }
.negative { color: var(--red); }
.remove-btn { width: 24px; height: 24px; background: transparent; border: 1px solid var(--border); border-radius: 4px; color: var(--text-secondary); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.remove-btn:hover { border-color: var(--red); color: var(--red); }
</style>
