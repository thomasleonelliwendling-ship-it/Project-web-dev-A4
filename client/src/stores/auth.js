import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch } from '../api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser() {
    try {
      const data = await apiFetch('/users/me')
      user.value = data.user
    } catch {
      user.value = null
    }
  }

  async function login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await fetchUser()
    return data
  }

  async function register(email, username, password) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    })
  }

  async function logout() {
    user.value = null
  }

  return { user, isAuthenticated, fetchUser, login, register, logout }
})
