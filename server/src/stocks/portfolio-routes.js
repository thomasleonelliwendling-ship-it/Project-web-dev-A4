import Portfolio from './portfolio-schema.js'
import Stock from './stock-schema.js'
import Transaction from './transaction-schema.js'

function getMode(request) {
  return request.query.mode === 'live' ? 'live' : 'demo'
}

async function getOrCreatePortfolio(userId, mode) {
  let portfolio = await Portfolio.findOne({ user: userId, mode }).lean()
  if (!portfolio) {
    const balance = mode === 'demo' ? 100000 : 0
    portfolio = await Portfolio.create({ user: userId, mode, balance, holdings: [] })
    portfolio = portfolio.toObject()
  }
  return portfolio
}

/**
 * @param {import('fastify').FastifyInstance} app
 */
function portfolioRoutes(app) {
  // Récupérer le portfolio de l'utilisateur connecté
  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const mode = getMode(request)

    const portfolio = await getOrCreatePortfolio(userId, mode)

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
        mode,
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
    const { symbol, quantity, mode: bodyMode } = request.body
    const mode = bodyMode === 'live' ? 'live' : 'demo'

    if (!symbol || !quantity || quantity < 1) {
      return reply.status(400).send({ error: 'Symbole et quantité (>= 1) requis' })
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() })
    if (!stock) {
      return reply.status(404).send({ error: 'Action introuvable' })
    }

    const total = stock.currentPrice * quantity

    let portfolio = await Portfolio.findOne({ user: userId, mode })
    if (!portfolio) {
      const balance = mode === 'demo' ? 100000 : 0
      portfolio = await Portfolio.create({ user: userId, mode, balance, holdings: [] })
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
      mode,
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
    const { symbol, quantity, mode: bodyMode } = request.body
    const mode = bodyMode === 'live' ? 'live' : 'demo'

    if (!symbol || !quantity || quantity < 1) {
      return reply.status(400).send({ error: 'Symbole et quantité (>= 1) requis' })
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() })
    if (!stock) {
      return reply.status(404).send({ error: 'Action introuvable' })
    }

    const portfolio = await Portfolio.findOne({ user: userId, mode })
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
      mode,
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
  // Reinitialiser le portfolio demo
  app.post('/reset-demo', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    await Portfolio.findOneAndDelete({ user: userId, mode: 'demo' })
    await Transaction.deleteMany({ user: userId, mode: 'demo' })
    const portfolio = await Portfolio.create({ user: userId, mode: 'demo', balance: 100000, holdings: [] })
    return reply.send({ message: 'Portfolio demo reinitialise', balance: portfolio.balance })
  })

  // Deposer de l'argent (live) - simulation
  app.post('/deposit', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const { amount } = request.body

    if (!amount || amount < 1) {
      return reply.status(400).send({ error: 'Montant invalide (minimum 1$)' })
    }

    let portfolio = await Portfolio.findOne({ user: userId, mode: 'live' })
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: userId, mode: 'live', balance: 0, holdings: [] })
    }

    portfolio.balance += amount
    await portfolio.save()

    return reply.send({ message: `Depot de $${amount} effectue`, balance: portfolio.balance })
  })
}

export default portfolioRoutes
