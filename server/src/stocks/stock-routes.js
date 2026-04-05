import Stock from './stock-schema.js'

// Simule un micro-mouvement de prix realiste a chaque requete
function tickPrice(basePrice) {
  const volatility = 0.002
  const change = (Math.random() - 0.48) * volatility
  return Math.round(basePrice * (1 + change) * 100) / 100
}

async function refreshPrices() {
  const stocks = await Stock.find().select('symbol currentPrice')
  const bulkOps = stocks.map((s) => {
    const newPrice = tickPrice(s.currentPrice)
    return {
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { currentPrice: newPrice, updatedAt: new Date() } },
      },
    }
  })
  if (bulkOps.length > 0) {
    await Stock.bulkWrite(bulkOps)
  }
}

// Rafraichir les prix toutes les 30 secondes
let refreshInterval = null
function startPriceRefresh() {
  if (refreshInterval) return
  refreshInterval = setInterval(refreshPrices, 30000)
  refreshPrices()
}

/**
 * @param {import('fastify').FastifyInstance} app
 */
function stockRoutes(app) {
  startPriceRefresh()

  // Liste de toutes les actions (sans l'historique complet pour la perf)
  app.get('', async (request, reply) => {
    const stocks = await Stock.find()
      .select('symbol name sector type logo currentPrice previousClose updatedAt')
      .sort({ symbol: 1 })
      .lean()

    const enriched = stocks.map((s) => ({
      ...s,
      change: s.currentPrice - s.previousClose,
      changePercent: ((s.currentPrice - s.previousClose) / s.previousClose) * 100,
    }))

    return reply.send({ stocks: enriched })
  })

  // Détail d'une action avec historique de prix
  app.get('/:symbol', async (request, reply) => {
    const { symbol } = request.params
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).lean()

    if (!stock) {
      return reply.status(404).send({ error: 'Action introuvable' })
    }

    return reply.send({
      stock: {
        ...stock,
        change: stock.currentPrice - stock.previousClose,
        changePercent: ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100,
      },
    })
  })
}

export default stockRoutes
