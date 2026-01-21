<script setup>
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <!-- 弹窗内容 -->
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform animate-bounce-in">
        <!-- 图标 -->
        <div class="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon class="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        
        <!-- 标题 -->
        <h3 class="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">
          登录已过期
        </h3>
        
        <!-- 描述 -->
        <p class="text-gray-500 dark:text-gray-400 text-center text-sm">
          您的登录凭证已过期，正在跳转到首页...
        </p>
        
        <!-- 加载动画 -->
        <div class="mt-4 flex justify-center">
          <div class="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out;
}
</style>
