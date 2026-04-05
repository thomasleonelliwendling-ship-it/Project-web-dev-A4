import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch } from '../api.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const portfolio = ref(null)
  const transactions = ref([])
  const loading = ref(false)
  const mode = ref('demo')

  async function fetchPortfolio() {
    loading.value = true
    try {
      const data = await apiFetch(`/portfolio?mode=${mode.value}`)
      portfolio.value = data.portfolio
    } finally {
      loading.value = false
    }
  }

  async function buyStock(symbol, quantity, stopLoss = null, takeProfit = null) {
    const data = await apiFetch('/portfolio/buy', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity: Number(quantity), mode: mode.value, stopLoss, takeProfit }),
    })
    await fetchPortfolio()
    return data
  }

  async function sellStock(symbol, quantity) {
    const data = await apiFetch('/portfolio/sell', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity: Number(quantity), mode: mode.value }),
    })
    await fetchPortfolio()
    return data
  }

  async function fetchTransactions() {
    const data = await apiFetch(`/transactions?mode=${mode.value}`)
    transactions.value = data.transactions
  }

  async function resetDemo() {
    const data = await apiFetch('/portfolio/reset-demo', { method: 'POST' })
    await fetchPortfolio()
    return data
  }

  async function deposit(amount) {
    const data = await apiFetch('/portfolio/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), mode: mode.value }),
    })
    await fetchPortfolio()
    return data
  }

  async function setSlTp(symbol, stopLoss, takeProfit) {
    const data = await apiFetch('/portfolio/sl-tp', {
      method: 'POST',
      body: JSON.stringify({ symbol, stopLoss, takeProfit, mode: mode.value }),
    })
    await fetchPortfolio()
    return data
  }

  function setMode(newMode) {
    mode.value = newMode
  }

  return { portfolio, transactions, loading, mode, fetchPortfolio, buyStock, sellStock, fetchTransactions, resetDemo, deposit, setSlTp, setMode }
})
