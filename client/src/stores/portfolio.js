import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePortfolioStore = defineStore('portfolio', () => {
  const portfolio = ref(null)
  const transactions = ref([])
  const loading = ref(false)

  async function fetchPortfolio() {
    loading.value = true
    try {
      const res = await fetch('/api/portfolio')
      const data = await res.json()
      portfolio.value = data.portfolio
    } finally {
      loading.value = false
    }
  }

  async function buyStock(symbol, quantity) {
    const res = await fetch('/api/portfolio/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, quantity: Number(quantity) }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    await fetchPortfolio()
    return data
  }

  async function sellStock(symbol, quantity) {
    const res = await fetch('/api/portfolio/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, quantity: Number(quantity) }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    await fetchPortfolio()
    return data
  }

  async function fetchTransactions() {
    const res = await fetch('/api/transactions')
    const data = await res.json()
    transactions.value = data.transactions
  }

  return { portfolio, transactions, loading, fetchPortfolio, buyStock, sellStock, fetchTransactions }
})
