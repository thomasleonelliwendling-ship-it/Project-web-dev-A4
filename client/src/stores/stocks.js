import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref([])
  const currentStock = ref(null)
  const loading = ref(false)

  async function fetchStocks() {
    loading.value = true
    try {
      const res = await fetch('/api/stocks')
      const data = await res.json()
      stocks.value = data.stocks
    } finally {
      loading.value = false
    }
  }

  async function fetchStock(symbol) {
    loading.value = true
    try {
      const res = await fetch(`/api/stocks/${symbol}`)
      const data = await res.json()
      currentStock.value = data.stock
    } finally {
      loading.value = false
    }
  }

  return { stocks, currentStock, loading, fetchStocks, fetchStock }
})
