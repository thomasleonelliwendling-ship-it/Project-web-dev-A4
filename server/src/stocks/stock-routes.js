import Stock from './stock-schema.js'

/**
 * @param {import('fastify').FastifyInstance} app
 */
function stockRoutes(app) {
  // Liste de toutes les actions (sans l'historique complet pour la perf)
  app.get('', async (request, reply) => {
    const stocks = await Stock.find()
      .select('symbol name sector logo currentPrice previousClose updatedAt')
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
