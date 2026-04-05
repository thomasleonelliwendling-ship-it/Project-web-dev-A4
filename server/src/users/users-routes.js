import User from './user-schema.js'

/**
 *
 * @param {import('fastify').FastifyInstance} app
 */
function usersRoutes(app) {
  app.get('/verify-email', async (request, reply) => {
    const { token } = request.query

    if (!token) {
      return reply.status(400).send({ error: 'Token de validation requis' })
    }

    const user = await User.findOne({ validationToken: token })

    if (!user) {
      return reply.status(404).send({ error: 'Token invalide ou expiré' })
    }

    if (user.emailVerified) {
      return reply.send({ message: 'Email déjà vérifié' })
    }

    user.emailVerified = true
    user.validationToken = null
    await user.save()

    return reply.send({ message: 'Email vérifié avec succès' })
  })

  app.get('/me', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    return reply.send({ user: request.currentUser })
  })

  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query
    const skip = (Number(page) - 1) * Number(limit)
    const users = await User.find()
      .select('_id email username createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()
    return reply.send({ users })
  })

  app.get('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = await User.findById(id)
      .select('_id email username createdAt')
      .lean()
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }
    return reply.send({ user })
  })

  app.delete('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }
    return reply.send({ message: 'Utilisateur supprimé' })
  })
}

export default usersRoutes
