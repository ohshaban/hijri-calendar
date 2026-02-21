import { ref, onMounted } from 'vue'
import { requestOtp, verifyOtp, checkAuth, logout as apiLogout } from '../utils/api.js'

export function useAuth() {
  const isAuthenticated = ref(false)
  const email = ref('')
  const loading = ref(false)
  const error = ref('')

  onMounted(async () => {
    const token = localStorage.getItem('hilal_token')
    if (token) {
      const result = await checkAuth()
      isAuthenticated.value = result.authenticated
      if (result.email) email.value = result.email
      if (!result.authenticated) {
        localStorage.removeItem('hilal_token')
        localStorage.removeItem('hilal_email')
      }
    }
  })

  async function sendOtp(emailAddr) {
    loading.value = true
    error.value = ''
    try {
      await requestOtp(emailAddr)
      return true
    } catch (err) {
      error.value = err.error || 'Failed to send code'
      return false
    } finally {
      loading.value = false
    }
  }

  async function verify(emailAddr, code) {
    loading.value = true
    error.value = ''
    try {
      const result = await verifyOtp(emailAddr, code)
      isAuthenticated.value = true
      email.value = result.email
      return true
    } catch (err) {
      error.value = err.error || 'Verification failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await apiLogout()
    isAuthenticated.value = false
    email.value = ''
  }

  return { isAuthenticated, email, loading, error, sendOtp, verify, logout }
}
