import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null)
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
    const error = ref(null)
    const isLoading = ref(false)
    const router = useRouter()

    const isAuthenticated = computed(() => !!token.value)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

    // Configure axios defaults
    if (token.value) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }

    const login = async (username, password) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            })

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user
                
                // Persist to localStorage
                localStorage.setItem('token', token.value)
                localStorage.setItem('user', JSON.stringify(user.value))
                
                // Set default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
                return true
            }
        } catch (err) {
            console.error('Login failed:', err)
            error.value = err.response?.data?.message || '登录失败，请检查凭证'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        // router.push('/login') // Optional: redirect
    }

    return {
        token,
        user,
        error,
        isLoading,
        isAuthenticated,
        login,
        logout
    }
})
