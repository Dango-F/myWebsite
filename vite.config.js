import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    hmr: {
      overlay: true, // 显示错误覆盖层
    },
    watch: {
      usePolling: true, // 使用轮询方式监听文件更改（在某些系统上可能需要）
      interval: 100     // 轮询间隔
    }
  }
})
