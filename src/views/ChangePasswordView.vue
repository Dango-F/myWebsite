<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { LockClosedIcon, KeyIcon, CheckCircleIcon, UserCircleIcon } from '@heroicons/vue/24/outline'
import axios from 'axios'

const authStore = useAuthStore()
const router = useRouter()

const newUsername = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref(null)
const success = ref(false)
const isLoading = ref(false)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const handleSubmit = async () => {
  error.value = null
  success.value = false

  // 验证当前密码必填
  if (!currentPassword.value) {
    error.value = '请输入当前密码以确认身份'
    return
  }

  // 检查是否要修改密码
  const isChangingPassword = newPassword.value || confirmPassword.value
  
  if (isChangingPassword) {
    if (!newPassword.value || !confirmPassword.value) {
      error.value = '请填写完整的新密码信息'
      return
    }

    if (newPassword.value !== confirmPassword.value) {
      error.value = '两次输入的新密码不一致'
      return
    }

    if (newPassword.value.length < 6) {
      error.value = '新密码至少需要6个字符'
      return
    }
  }

  // 检查是否要修改用户名
  const isChangingUsername = newUsername.value.trim() !== ''
  
  if (isChangingUsername && newUsername.value.length < 3) {
    error.value = '新用户名至少需要3个字符'
    return
  }

  // 至少要修改一项
  if (!isChangingPassword && !isChangingUsername) {
    error.value = '请至少修改用户名或密码中的一项'
    return
  }

  isLoading.value = true

  try {
    // 先修改密码（如果需要）
    if (isChangingPassword) {
      await axios.put(
        `${API_URL}/auth/password`,
        {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value
        },
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )
    }

    // 再修改用户名（如果需要）
    if (isChangingUsername) {
      const response = await axios.put(
        `${API_URL}/auth/username`,
        {
          newUsername: newUsername.value,
          password: currentPassword.value
        },
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      )

      // 更新 token 和用户信息
      if (response.data.token) {
        authStore.token = response.data.token
        authStore.user = response.data.user
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      }
    }

    success.value = true
    
    // 清空表单
    newUsername.value = ''
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    // 2秒后返回首页
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (err) {
    console.error('修改失败:', err)
    error.value = err.response?.data?.message || '修改失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Change Password Card -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-8 text-center border-b border-gray-100 dark:border-gray-700">
          <div class="mx-auto bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <KeyIcon class="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">账户设置</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">修改用户名和密码</p>
        </div>

        <!-- Form -->
        <div class="p-8 space-y-6">
          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
            {{ error }}
          </div>

          <!-- Success Message -->
          <div v-if="success" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-2">
            <CheckCircleIcon class="w-5 h-5" />
            修改成功！正在跳转...
          </div>

          <!-- Current User Info -->
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm">
            <span class="text-gray-600 dark:text-gray-400">当前用户名：</span>
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ authStore.user?.username }}</span>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- New Username (Optional) -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                新用户名 <span class="text-gray-400 text-xs">(可选，不填则不修改)</span>
              </label>
              <div class="relative">
                <input 
                  type="text" 
                  v-model="newUsername"
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none text-gray-800 dark:text-gray-200"
                  placeholder="留空则不修改"
                  :disabled="isLoading || success"
                  minlength="3"
                />
                <UserCircleIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">密码修改</span>
              </div>
            </div>

            <!-- Current Password -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                当前密码 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input 
                  type="password" 
                  v-model="currentPassword"
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none text-gray-800 dark:text-gray-200"
                  placeholder="输入当前密码"
                  required
                  :disabled="isLoading || success"
                />
                <LockClosedIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <!-- New Password -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                新密码 <span class="text-gray-400 text-xs">(可选，不填则不修改)</span>
              </label>
              <div class="relative">
                <input 
                  type="password" 
                  v-model="newPassword"
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none text-gray-800 dark:text-gray-200"
                  placeholder="至少6个字符，留空则不修改"
                  minlength="6"
                  :disabled="isLoading || success"
                />
                <KeyIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <!-- Confirm New Password -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                确认新密码 <span class="text-gray-400 text-xs">(填写新密码时必填)</span>
              </label>
              <div class="relative">
                <input 
                  type="password" 
                  v-model="confirmPassword"
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none text-gray-800 dark:text-gray-200"
                  placeholder="再次输入新密码"
                  :disabled="isLoading || success"
                />
                <LockClosedIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3">
              <button 
                type="button"
                @click="goBack"
                :disabled="isLoading"
                class="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button 
                type="submit"
                :disabled="isLoading || success"
                class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  修改中...
                </span>
                <span v-else>确认修改</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
