import Fastify from 'fastify'
import cors from '@fastify/cors'

import config from './config.js'
import envToLogger from './logger.js'
import authPlugin from './plugins/auth.js'
import mongoosePlugin from './plugins/mongoose.js'
import rootRoutes from './rootRoute.js'
import authRoutes from './users/auth-routes.js'
import usersRoutes from './users/users-routes.js'
import stockRoutes from './stocks/stock-routes.js'
import portfolioRoutes from './stocks/portfolio-routes.js'
import transactionRoutes from './stocks/transaction-routes.js'
import { seedStocks } from './stocks/seed-stocks.js'

async function buildApp() {
  const fastify = Fastify({
    logger: envToLogger[config.env] ?? true,
  })

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin
        || origin === config.appBaseUrl
        || origin.endsWith('.netlify.app')
        || origin.endsWith('.vercel.app')
        || origin.startsWith('http://localhost')) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
  })
  await fastify.register(authPlugin)
  await fastify.register(mongoosePlugin)

  // Migration: supprimer l'ancien index unique user_1 sur portfolios
  try {
    const db = (await import('mongoose')).default.connection.db
    const indexes = await db.collection('portfolios').indexes()
    const oldIndex = indexes.find(i => i.name === 'user_1' && i.unique)
    if (oldIndex) {
      await db.collection('portfolios').dropIndex('user_1')
      fastify.log.info('Dropped legacy user_1 unique index on portfolios')
    }
  } catch {
    // Collection may not exist yet
  }

  // Seed des données boursières au démarrage
  await seedStocks()

  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(usersRoutes, { prefix: '/users' })
  fastify.register(stockRoutes, { prefix: '/stocks' })
  fastify.register(portfolioRoutes, { prefix: '/portfolio' })
  fastify.register(transactionRoutes, { prefix: '/transactions' })
  fastify.register(rootRoutes)

  return fastify
}

export default buildApp
