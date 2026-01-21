<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { UserCircleIcon, LockClosedIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) return
  
  const success = await authStore.login(username.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Login Card -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 text-center border-b border-gray-100 dark:border-gray-700">
          <div class="mx-auto bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <UserCircleIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">管理员登录</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">请输入凭证以进入编辑模式</p>
        </div>

        <!-- Form -->
        <div class="p-8 space-y-6">
          <div v-if="authStore.error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
            {{ authStore.error }}
          </div>

          <form @submit.prevent="handleLogin" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">用户名</label>
              <div class="relative">
                <input 
                  type="text" 
                  v-model="username"
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none text-gray-800 dark:text-gray-200"
                  placeholder="请输入用户名"
                  required
                />
                <UserCircleIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">密码</label>
              <div class="relative">
                <input 
                  type="password" 
                  v-model="password"
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none text-gray-800 dark:text-gray-200"
                  placeholder="请输入密码"
                  required
                />
                <LockClosedIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button 
              type="submit"
              :disabled="authStore.isLoading"
              class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="authStore.isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
              <span v-else class="flex items-center">
                进入系统
                <ArrowRightOnRectangleIcon class="w-5 h-5 ml-2" />
              </span>
            </button>
          </form>
        </div>
      </div>
      
      <!-- Back Link -->
      <div class="text-center mt-6">
        <router-link to="/" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>
