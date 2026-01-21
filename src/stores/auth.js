import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null)
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
    const error = ref(null)
    const isLoading = ref(false)
    const showTokenExpiredModal = ref(false) // 显示过期提示弹窗
    const router = useRouter()
    
    // 精准过期定时器句柄
    let tokenExpireTimer = null

    // 解析 JWT token 获取 payload
    const parseJWT = (token) => {
        try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            return JSON.parse(jsonPayload)
        } catch (e) {
            console.error('JWT 解析失败:', e)
            return null
        }
    }

    // 检查 token 是否已过期
    const isTokenExpired = () => {
        if (!token.value) return true
        
        const payload = parseJWT(token.value)
        if (!payload || !payload.exp) return true
        
        // exp 是秒级时间戳，乘以1000转换为毫秒
        const expTime = payload.exp * 1000
        const now = Date.now()
        
        return now >= expTime
    }

    // 获取 token 剩余有效时间（秒）
    const getTokenRemainingTime = () => {
        if (!token.value) return 0
        
        const payload = parseJWT(token.value)
        if (!payload || !payload.exp) return 0
        
        const expTime = payload.exp * 1000
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((expTime - now) / 1000))
        
        return remaining
    }

    // 清除过期定时器
    const clearTokenExpiryTimer = () => {
        if (tokenExpireTimer) {
            clearTimeout(tokenExpireTimer)
            tokenExpireTimer = null
        }
    }

    // 触发过期处理（弹窗 + 跳转）
    const triggerTokenExpired = () => {
        showTokenExpiredModal.value = true
        // 3秒后自动登出并跳转到首页
        setTimeout(() => {
            logout()
            showTokenExpiredModal.value = false
            router.push('/')
        }, 3000)
    }

    // 调度精准过期定时器（登录后调用）
    const scheduleTokenExpiry = () => {
        // 先清除旧定时器
        clearTokenExpiryTimer()
        
        if (!token.value) return
        
        const payload = parseJWT(token.value)
        if (!payload || !payload.exp) {
            // token 无效，立即登出
            logout()
            return
        }
        
        const expTime = payload.exp * 1000
        const now = Date.now()
        const remainingMs = expTime - now
        
        if (remainingMs <= 0) {
            // 已过期，立即触发
            console.log('Token 已过期，立即触发登出')
            triggerTokenExpired()
            return
        }
        
        console.log(`Token 将在 ${Math.floor(remainingMs / 1000)} 秒后过期`)
        
        // 设置精准定时器
        tokenExpireTimer = setTimeout(() => {
            console.log('Token 过期定时器触发')
            triggerTokenExpired()
        }, remainingMs)
    }

    // 检查并处理 token 过期（页面激活时调用）
    const checkTokenExpiration = () => {
        if (token.value && isTokenExpired()) {
            clearTokenExpiryTimer()
            triggerTokenExpired()
            return true // 已过期
        }
        // 如果没过期但定时器不存在，重新调度
        if (token.value && !tokenExpireTimer) {
            scheduleTokenExpiry()
        }
        return false // 未过期
    }

    const isAuthenticated = computed(() => !!token.value && !isTokenExpired())
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
                
                // 调度精准过期定时器
                scheduleTokenExpiry()
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
        // 清除过期定时器
        clearTokenExpiryTimer()
        
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
        showTokenExpiredModal,
        login,
        logout,
        isTokenExpired,
        checkTokenExpiration,
        getTokenRemainingTime,
        parseJWT,
        scheduleTokenExpiry,
        clearTokenExpiryTimer
    }
})
