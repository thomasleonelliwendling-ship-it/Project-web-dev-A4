import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch } from '../api.js'

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref([])
  const currentStock = ref(null)
  const loading = ref(false)

  async function fetchStocks() {
    loading.value = true
    try {
      const data = await apiFetch('/stocks')
      stocks.value = data.stocks
    } finally {
      loading.value = false
    }
  }

  async function fetchStock(symbol) {
    loading.value = true
    try {
      const data = await apiFetch(`/stocks/${symbol}`)
      currentStock.value = data.stock
    } finally {
      loading.value = false
    }
  }

  return { stocks, currentStock, loading, fetchStocks, fetchStock }
})
