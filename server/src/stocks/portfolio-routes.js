import Portfolio from './portfolio-schema.js'
import Stock from './stock-schema.js'
import Transaction from './transaction-schema.js'

/**
 * @param {import('fastify').FastifyInstance} app
 */
function portfolioRoutes(app) {
  // Récupérer le portfolio de l'utilisateur connecté
  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub

    let portfolio = await Portfolio.findOne({ user: userId }).lean()

    if (!portfolio) {
      portfolio = await Portfolio.create({ user: userId, balance: 100000, holdings: [] })
      portfolio = portfolio.toObject()
    }

    // Enrichir les holdings avec les prix actuels
    const symbols = portfolio.holdings.map((h) => h.symbol)
    const stocks = await Stock.find({ symbol: { $in: symbols } })
      .select('symbol currentPrice')
      .lean()
    const priceMap = Object.fromEntries(stocks.map((s) => [s.symbol, s.currentPrice]))

    const holdings = portfolio.holdings.map((h) => ({
      ...h,
      currentPrice: priceMap[h.symbol] || 0,
      marketValue: (priceMap[h.symbol] || 0) * h.quantity,
      gainLoss: ((priceMap[h.symbol] || 0) - h.averageCost) * h.quantity,
      gainLossPercent: h.averageCost > 0
        ? (((priceMap[h.symbol] || 0) - h.averageCost) / h.averageCost) * 100
        : 0,
    }))

    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

    return reply.send({
      portfolio: {
        ...portfolio,
        holdings,
        totalMarketValue,
        totalValue: portfolio.balance + totalMarketValue,
      },
    })
  })

  // Acheter une action
  app.post('/buy', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const { symbol, quantity } = request.body

    if (!symbol || !quantity || quantity < 1) {
      return reply.status(400).send({ error: 'Symbole et quantité (>= 1) requis' })
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() })
    if (!stock) {
      return reply.status(404).send({ error: 'Action introuvable' })
    }

    const total = stock.currentPrice * quantity

    let portfolio = await Portfolio.findOne({ user: userId })
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: userId, balance: 100000, holdings: [] })
    }

    if (portfolio.balance < total) {
      return reply.status(400).send({ error: 'Solde insuffisant', balance: portfolio.balance, required: total })
    }

    // Mettre à jour le solde
    portfolio.balance -= total

    // Mettre à jour ou ajouter le holding
    const existingHolding = portfolio.holdings.find((h) => h.symbol === stock.symbol)
    if (existingHolding) {
      const totalCost = existingHolding.averageCost * existingHolding.quantity + total
      existingHolding.quantity += quantity
      existingHolding.averageCost = totalCost / existingHolding.quantity
    } else {
      portfolio.holdings.push({
        stock: stock._id,
        symbol: stock.symbol,
        quantity,
        averageCost: stock.currentPrice,
      })
    }

    await portfolio.save()

    // Enregistrer la transaction
    await Transaction.create({
      user: userId,
      stock: stock._id,
      symbol: stock.symbol,
      type: 'buy',
      quantity,
      price: stock.currentPrice,
      total,
    })

    return reply.status(201).send({
      message: `Achat de ${quantity} ${stock.symbol} effectué`,
      balance: portfolio.balance,
      total,
    })
  })

  // Vendre une action
  app.post('/sell', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const { symbol, quantity } = request.body

    if (!symbol || !quantity || quantity < 1) {
      return reply.status(400).send({ error: 'Symbole et quantité (>= 1) requis' })
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() })
    if (!stock) {
      return reply.status(404).send({ error: 'Action introuvable' })
    }

    const portfolio = await Portfolio.findOne({ user: userId })
    if (!portfolio) {
      return reply.status(400).send({ error: 'Aucun portfolio trouvé' })
    }

    const holding = portfolio.holdings.find((h) => h.symbol === stock.symbol)
    if (!holding || holding.quantity < quantity) {
      return reply.status(400).send({ error: 'Quantité insuffisante en portefeuille' })
    }

    const total = stock.currentPrice * quantity

    // Mettre à jour le holding
    holding.quantity -= quantity
    if (holding.quantity === 0) {
      portfolio.holdings = portfolio.holdings.filter((h) => h.symbol !== stock.symbol)
    }

    portfolio.balance += total
    await portfolio.save()

    // Enregistrer la transaction
    await Transaction.create({
      user: userId,
      stock: stock._id,
      symbol: stock.symbol,
      type: 'sell',
      quantity,
      price: stock.currentPrice,
      total,
    })

    return reply.status(201).send({
      message: `Vente de ${quantity} ${stock.symbol} effectuée`,
      balance: portfolio.balance,
      total,
    })
  })
}

export default portfolioRoutes
