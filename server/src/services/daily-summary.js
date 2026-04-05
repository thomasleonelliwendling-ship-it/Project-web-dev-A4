import Portfolio from '../stocks/portfolio-schema.js'
import Stock from '../stocks/stock-schema.js'
import Transaction from '../stocks/transaction-schema.js'
import User from '../users/user-schema.js'
import { sendDailySummaryEmail } from './mailer.js'

/**
 * Envoie un bilan quotidien a chaque utilisateur ayant un portfolio actif.
 */
export async function sendDailySummaries(logger) {
  try {
    const portfolios = await Portfolio.find({ 'holdings.0': { $exists: true } }).lean()

    if (portfolios.length === 0) return

    // Prix actuels
    const allSymbols = new Set()
    for (const p of portfolios) {
      for (const h of p.holdings) allSymbols.add(h.symbol)
    }
    const stocks = await Stock.find({ symbol: { $in: [...allSymbols] } }).select('symbol currentPrice previousClose').lean()
    const priceMap = Object.fromEntries(stocks.map(s => [s.symbol, s.currentPrice]))
    const prevMap = Object.fromEntries(stocks.map(s => [s.symbol, s.previousClose]))

    // Transactions des dernieres 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    for (const p of portfolios) {
      const user = await User.findById(p.user).select('email username').lean()
      if (!user) continue

      const holdings = p.holdings.map(h => {
        const cur = priceMap[h.symbol] || h.averageCost
        const prev = prevMap[h.symbol] || cur
        return {
          symbol: h.symbol,
          quantity: h.quantity,
          currentPrice: cur,
          gainLoss: (cur - h.averageCost) * h.quantity,
          dailyChange: (cur - prev) * h.quantity,
        }
      })

      const totalValue = p.balance + holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0)
      const dailyPnl = holdings.reduce((s, h) => s + h.dailyChange, 0)
      const totalMarketValue = holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0)
      const dailyPnlPercent = totalMarketValue > 0 ? (dailyPnl / totalMarketValue) * 100 : 0

      const recentTx = await Transaction.find({
        user: p.user,
        mode: p.mode,
        createdAt: { $gte: yesterday },
      }).sort({ createdAt: -1 }).limit(5).lean()

      sendDailySummaryEmail({
        email: user.email,
        username: user.username,
        totalValue,
        dailyPnl,
        dailyPnlPercent,
        holdings,
        transactions: recentTx,
      }).catch(err => {
        if (logger) logger.error({ err, email: user.email }, 'Failed to send daily summary')
      })
    }

    if (logger) logger.info(`Daily summaries sent to ${portfolios.length} portfolio(s)`)
  } catch (err) {
    if (logger) logger.error({ err }, 'Daily summary error')
  }
}

/**
 * Demarre le scheduler pour le bilan quotidien.
 * Envoie tous les jours a 15h UTC.
 */
export function startDailyScheduler(logger) {
  function scheduleNext() {
    const now = new Date()
    const target = new Date(now)
    target.setUTCHours(15, 0, 0, 0)
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }
    const delay = target.getTime() - now.getTime()

    if (logger) logger.info(`Daily summary scheduled in ${Math.round(delay / 1000 / 60)} minutes`)

    setTimeout(async () => {
      await sendDailySummaries(logger)
      scheduleNext()
    }, delay)
  }

  scheduleNext()
}
