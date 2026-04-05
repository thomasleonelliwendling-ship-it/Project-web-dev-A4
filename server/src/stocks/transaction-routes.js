import Transaction from './transaction-schema.js'
import Stock from './stock-schema.js'

/**
 * @param {import('fastify').FastifyInstance} app
 */
function transactionRoutes(app) {
  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const { page = 1, limit = 50 } = request.query
    const mode = request.query.mode === 'live' ? 'live' : 'demo'
    const skip = (Number(page) - 1) * Number(limit)

    const filter = { user: userId, mode }
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ])

    // Enrichir avec le prix actuel pour calcul P&L
    const symbols = [...new Set(transactions.map(t => t.symbol))]
    const stocks = await Stock.find({ symbol: { $in: symbols } }).select('symbol currentPrice').lean()
    const priceMap = Object.fromEntries(stocks.map(s => [s.symbol, s.currentPrice]))

    const enriched = transactions.map(t => {
      const currentPrice = priceMap[t.symbol] || t.price
      const pnl = t.type === 'buy'
        ? (currentPrice - t.price) * t.quantity
        : (t.price - currentPrice) * t.quantity
      const pnlPercent = t.price > 0 ? ((currentPrice - t.price) / t.price) * 100 : 0
      return { ...t, currentPrice, pnl: Math.round(pnl * 100) / 100, pnlPercent: Math.round(pnlPercent * 100) / 100 }
    })

    return reply.send({ transactions: enriched, total, page: Number(page), limit: Number(limit) })
  })
}

export default transactionRoutes
