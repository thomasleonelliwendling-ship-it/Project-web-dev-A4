import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch } from '../api.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const portfolio = ref(null)
  const transactions = ref([])
  const loading = ref(false)

  async function fetchPortfolio() {
    loading.value = true
    try {
      const data = await apiFetch('/portfolio')
      portfolio.value = data.portfolio
    } finally {
      loading.value = false
    }
  }

  async function buyStock(symbol, quantity) {
    const data = await apiFetch('/portfolio/buy', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity: Number(quantity) }),
    })
    await fetchPortfolio()
    return data
  }

  async function sellStock(symbol, quantity) {
    const data = await apiFetch('/portfolio/sell', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity: Number(quantity) }),
    })
    await fetchPortfolio()
    return data
  }

  async function fetchTransactions() {
    const data = await apiFetch('/transactions')
    transactions.value = data.transactions
  }

  return { portfolio, transactions, loading, fetchPortfolio, buyStock, sellStock, fetchTransactions }
})
