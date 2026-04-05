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
    try {
      const userId = request.user.sub
      const { symbol, quantity, mode: bodyMode } = request.body
      const mode = bodyMode === 'live' ? 'live' : 'demo'

      if (!symbol || !quantity || quantity <= 0) {
        return reply.status(400).send({ error: 'Symbole et quantite requise' })
      }

      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() })
      if (!stock) {
        return reply.status(404).send({ error: 'Action introuvable' })
      }

      // Arrondir la quantité à 8 décimales max (crypto-compatible)
      const qty = Math.round(quantity * 1e8) / 1e8
      const total = stock.currentPrice * qty

      let portfolio = await Portfolio.findOne({ user: userId, mode })
      if (!portfolio) {
        const balance = mode === 'demo' ? 100000 : 0
        portfolio = new Portfolio({ user: userId, mode, balance, holdings: [] })
        await portfolio.save()
      }

      if (portfolio.balance < total) {
        return reply.status(400).send({ error: `Solde insuffisant ($${portfolio.balance.toFixed(2)} disponible, $${total.toFixed(2)} requis)` })
      }

      portfolio.balance -= total

      const existingHolding = portfolio.holdings.find((h) => h.symbol === stock.symbol)
      if (existingHolding) {
        const totalCost = existingHolding.averageCost * existingHolding.quantity + total
        existingHolding.quantity += qty
        existingHolding.averageCost = totalCost / existingHolding.quantity
      } else {
        portfolio.holdings.push({
          stock: stock._id,
          symbol: stock.symbol,
          quantity: qty,
          averageCost: stock.currentPrice,
        })
      }

      await portfolio.save()

      await Transaction.create({
        user: userId,
        stock: stock._id,
        symbol: stock.symbol,
        type: 'buy',
        mode,
        quantity: qty,
        price: stock.currentPrice,
        total,
      })

      return reply.status(201).send({
        message: `Achat de ${qty} ${stock.symbol} effectue`,
        balance: portfolio.balance,
        total,
      })
    } catch (err) {
      app.log.error({ err }, 'Buy error')
      return reply.status(500).send({ error: `Erreur lors de l'achat: ${err.message}` })
    }
  })

  // Vendre une action
  app.post('/sell', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.sub
      const { symbol, quantity, mode: bodyMode } = request.body
      const mode = bodyMode === 'live' ? 'live' : 'demo'

      if (!symbol || !quantity || quantity <= 0) {
        return reply.status(400).send({ error: 'Symbole et quantite requise' })
      }

      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() })
      if (!stock) {
        return reply.status(404).send({ error: 'Action introuvable' })
      }

      const qty = Math.round(quantity * 1e8) / 1e8

      const portfolio = await Portfolio.findOne({ user: userId, mode })
      if (!portfolio) {
        return reply.status(400).send({ error: 'Aucun portfolio trouve' })
      }

      const holding = portfolio.holdings.find((h) => h.symbol === stock.symbol)
      if (!holding || holding.quantity < qty) {
        return reply.status(400).send({ error: 'Quantite insuffisante en portefeuille' })
      }

      const total = stock.currentPrice * qty
      holding.quantity -= qty
      if (holding.quantity < 0.00000001) {
        portfolio.holdings = portfolio.holdings.filter((h) => h.symbol !== stock.symbol)
      }

      portfolio.balance += total
      await portfolio.save()

      await Transaction.create({
        user: userId,
        stock: stock._id,
        symbol: stock.symbol,
        type: 'sell',
        mode,
        quantity: qty,
        price: stock.currentPrice,
        total,
      })

      return reply.status(201).send({
        message: `Vente de ${qty} ${stock.symbol} effectuee`,
        balance: portfolio.balance,
        total,
      })
    } catch (err) {
      app.log.error({ err }, 'Sell error')
      return reply.status(500).send({ error: `Erreur lors de la vente: ${err.message}` })
    }
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

  // Deposer de l'argent
  app.post('/deposit', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const { amount, mode: bodyMode } = request.body
    const mode = bodyMode === 'live' ? 'live' : 'demo'

    if (!amount || amount < 1) {
      return reply.status(400).send({ error: 'Montant invalide (minimum 1$)' })
    }

    let portfolio = await Portfolio.findOne({ user: userId, mode })
    if (!portfolio) {
      const initBalance = mode === 'demo' ? 100000 : 0
      portfolio = new Portfolio({ user: userId, mode, balance: initBalance, holdings: [] })
    }

    portfolio.balance += amount
    await portfolio.save()

    return reply.send({ message: `Depot de $${amount} effectue`, balance: portfolio.balance })
  })
}

export default portfolioRoutes
