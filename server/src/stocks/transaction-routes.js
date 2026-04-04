import Transaction from './transaction-schema.js'

/**
 * @param {import('fastify').FastifyInstance} app
 */
function transactionRoutes(app) {
  // Historique des transactions de l'utilisateur connecté
  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.sub
    const { page = 1, limit = 50 } = request.query
    const skip = (Number(page) - 1) * Number(limit)

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments({ user: userId }),
    ])

    return reply.send({ transactions, total, page: Number(page), limit: Number(limit) })
  })
}

export default transactionRoutes
