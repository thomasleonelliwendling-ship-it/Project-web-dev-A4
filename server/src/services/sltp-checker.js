import Portfolio from '../stocks/portfolio-schema.js'
import Stock from '../stocks/stock-schema.js'
import Transaction from '../stocks/transaction-schema.js'
import User from '../users/user-schema.js'
import { sendStopLossEmail, sendTakeProfitEmail } from './mailer.js'

/**
 * Verifie toutes les positions ouvertes et declenche SL/TP si atteints.
 * Appele apres chaque refresh de prix.
 */
export async function checkSlTp(logger) {
  try {
    // Recuperer tous les portfolios avec des SL ou TP definis
    const portfolios = await Portfolio.find({
      'holdings.stopLoss': { $ne: null },
    }).lean()

    const portfoliosTP = await Portfolio.find({
      'holdings.takeProfit': { $ne: null },
    }).lean()

    // Merger sans doublon
    const allIds = new Set()
    const all = []
    for (const p of [...portfolios, ...portfoliosTP]) {
      const id = p._id.toString()
      if (!allIds.has(id)) {
        allIds.add(id)
        all.push(p)
      }
    }

    if (all.length === 0) return

    // Recuperer les prix actuels
    const allSymbols = new Set()
    for (const p of all) {
      for (const h of p.holdings) {
        allSymbols.add(h.symbol)
      }
    }
    const stocks = await Stock.find({ symbol: { $in: [...allSymbols] } }).select('symbol currentPrice').lean()
    const priceMap = Object.fromEntries(stocks.map(s => [s.symbol, s.currentPrice]))

    for (const p of all) {
      const portfolio = await Portfolio.findById(p._id)
      if (!portfolio) continue

      const user = await User.findById(p.user).select('email username').lean()
      if (!user) continue

      let changed = false

      for (let i = portfolio.holdings.length - 1; i >= 0; i--) {
        const h = portfolio.holdings[i]
        const currentPrice = priceMap[h.symbol]
        if (!currentPrice) continue

        // Stop Loss
        if (h.stopLoss && currentPrice <= h.stopLoss) {
          const total = currentPrice * h.quantity
          const loss = (currentPrice - h.averageCost) * h.quantity
          portfolio.balance += total
          portfolio.holdings.splice(i, 1)
          changed = true

          await Transaction.create({
            user: p.user,
            stock: h.stock,
            symbol: h.symbol,
            type: 'sell',
            mode: p.mode,
            quantity: h.quantity,
            price: currentPrice,
            total,
          })

          sendStopLossEmail({
            email: user.email,
            username: user.username,
            symbol: h.symbol,
            quantity: h.quantity,
            triggerPrice: currentPrice,
            averageCost: h.averageCost,
            loss,
          }).catch(err => {
            if (logger) logger.error({ err, email: user.email }, 'Failed to send SL email')
          })

          if (logger) logger.info(`SL triggered: ${h.symbol} for ${user.email}`)
          continue
        }

        // Take Profit
        if (h.takeProfit && currentPrice >= h.takeProfit) {
          const total = currentPrice * h.quantity
          const profit = (currentPrice - h.averageCost) * h.quantity
          portfolio.balance += total
          portfolio.holdings.splice(i, 1)
          changed = true

          await Transaction.create({
            user: p.user,
            stock: h.stock,
            symbol: h.symbol,
            type: 'sell',
            mode: p.mode,
            quantity: h.quantity,
            price: currentPrice,
            total,
          })

          sendTakeProfitEmail({
            email: user.email,
            username: user.username,
            symbol: h.symbol,
            quantity: h.quantity,
            triggerPrice: currentPrice,
            averageCost: h.averageCost,
            profit,
          }).catch(err => {
            if (logger) logger.error({ err, email: user.email }, 'Failed to send TP email')
          })

          if (logger) logger.info(`TP triggered: ${h.symbol} for ${user.email}`)
          continue
        }
      }

      if (changed) {
        await portfolio.save()
      }
    }
  } catch (err) {
    if (logger) logger.error({ err }, 'SL/TP check error')
  }
}
