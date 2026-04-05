import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import StockDetailPage from '../pages/StockDetailPage.vue'
import PortfolioPage from '../pages/PortfolioPage.vue'
import TransactionsPage from '../pages/TransactionsPage.vue'
import WatchlistPage from '../pages/WatchlistPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { guest: true } },
    { path: '/', name: 'dashboard', component: DashboardPage },
    { path: '/stock/:symbol', name: 'stock', component: StockDetailPage },
    { path: '/portfolio', name: 'portfolio', component: PortfolioPage, meta: { auth: true } },
    { path: '/transactions', name: 'transactions', component: TransactionsPage, meta: { auth: true } },
    { path: '/watchlist', name: 'watchlist', component: WatchlistPage, meta: { auth: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.user && !auth._fetchAttempted) {
    auth._fetchAttempted = true
    await auth.fetchUser()
  }

  if (to.meta.auth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
