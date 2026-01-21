<script setup>
import { RouterView, useRouter } from "vue-router";
import TheHeader from "@/components/TheHeader.vue";
import NightSky from "@/components/NightSky.vue";
import TokenExpiredModal from "@/components/TokenExpiredModal.vue";
import { onMounted, onUnmounted, watch } from "vue";
import { useProfileStore } from "@/stores/profile";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const profileStore = useProfileStore();
const authStore = useAuthStore();

// 页面可见性变化处理（防止休眠导致定时器延迟）
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && authStore.token) {
    console.log('页面激活，检查 token 状态');
    authStore.checkTokenExpiration();
  }
};

// 监听登录状态变化，调度精准过期定时器
watch(
  () => authStore.token,
  (newToken) => {
    if (newToken) {
      console.log("用户已登录，调度精准过期定时器");
      // 如果是从 localStorage 恢复的 token，需要调度定时器
      authStore.scheduleTokenExpiry();
    } else {
      console.log("用户已登出");
    }
  },
  { immediate: true }
);

// 组件挂载时加载Profile
onMounted(async () => {
  // 从后端加载用户配置
  await profileStore.fetchProfile();
  
  // 添加页面可见性监听（防止休眠导致定时器延迟）
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 如果用户已登录，立即检查一次 token 是否过期
  if (authStore.token) {
    authStore.checkTokenExpiration();
  }
});

// 组件卸载时清除监听
onUnmounted(() => {
  // 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  // 清除过期定时器
  authStore.clearTokenExpiryTimer();
});
</script>

<template>
  <div
    class="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] relative dark-gradient"
  >
    <NightSky />
    <div class="relative z-10">
      <TheHeader />
      <RouterView />
    </div>
    
    <!-- Token 过期提示弹窗 -->
    <TokenExpiredModal v-if="authStore.showTokenExpiredModal" />
  </div>
</template>

<style>
:root {
  /* GitHub配色方案 */
  /* 主色调 */
  --github-blue: #0366d6;
  --github-green: #2ea44f;
  --github-red: #d73a49;
  --github-gray: #586069;
  --github-dark-gray: #24292e;

  /* 亮色模式 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #d0d0d0;
  --color-bg-tertiary: #f1f2f4;
  --color-text-primary: #24292e;
  --color-text-secondary: #586069;
  --color-border: #e1e4e8;
  --color-shadow: rgba(0, 0, 0, 0.05);
  --color-link: #0366d6;

  /* 强调色 */
  --color-accent-primary: #0366d6;
  --color-accent-secondary: #2ea44f;

  /* 卡片 */
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  --card-border: 1px solid var(--color-border);
  --card-radius: 6px;

  /* 动画 */
  --transition-time: 0.2s;
}

/* 暗色模式 */
.dark {
  --color-bg-primary: #121212;
  --color-bg-secondary: #1e1e1e;
  --color-bg-tertiary: #2d2d2d;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #a0a0a0;
  --color-border: #383838;
  --color-shadow: rgba(0, 0, 0, 0.3);
  --color-link: #bb86fc;

  /* 强调色 */
  --color-accent-primary: #bb86fc;
  --color-accent-secondary: #03dac6;

  /* GitHub 相关颜色适配 */
  --github-blue: #bb86fc;
  --github-green: #03dac6;
  --github-red: #cf6679;
  --github-gray: #a0a0a0;
  --github-dark-gray: #e0e0e0;
}

/* 暗色模式渐变背景 */
.dark .dark-gradient {
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 15, 0.4) 0%,
    rgba(18, 18, 36, 0.2) 40%,
    rgba(30, 30, 60, 0.1) 70%,
    rgba(200, 200, 255, 0.15) 100%
  );
  background-attachment: fixed;
  background-size: 100% 100vh;
  position: relative;
}

.dark .dark-gradient::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center bottom,
    rgba(180, 180, 255, 0.05) 0%,
    rgba(30, 30, 60, 0) 60%
  );
  z-index: 0;
  pointer-events: none;
}

/* 媒体查询根据系统偏好自动切换 */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --color-bg-primary: #121212;
    --color-bg-secondary: #1e1e1e;
    --color-bg-tertiary: #2d2d2d;
    --color-text-primary: #e0e0e0;
    --color-text-secondary: #a0a0a0;
    --color-border: #383838;
    --color-shadow: rgba(0, 0, 0, 0.3);
    --color-link: #bb86fc;

    /* 强调色 */
    --color-accent-primary: #bb86fc;
    --color-accent-secondary: #03dac6;

    /* GitHub 相关颜色适配 */
    --github-blue: #bb86fc;
    --github-green: #03dac6;
    --github-red: #cf6679;
    --github-gray: #a0a0a0;
    --github-dark-gray: #e0e0e0;
  }
}

html,
body {
  transition: background-color var(--transition-time) ease,
    color var(--transition-time) ease, border-color var(--transition-time) ease;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  /* 强制始终显示垂直滚动条，避免页面切换导航栏位置变化 */
  overflow-y: scroll;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.25;
}

a {
  color: var(--color-link);
  text-decoration: none;
  transition: color var(--transition-time) ease,
    background-color var(--transition-time) ease,
    border-color var(--transition-time) ease;
}

a:hover {
  text-decoration: none;
  border-radius: 6px;
}

button {
  transition: background-color var(--transition-time) ease,
    color var(--transition-time) ease, border-color var(--transition-time) ease,
    box-shadow var(--transition-time) ease;
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--github-gray);
}

/* 美化选择文本 */
::selection {
  background-color: var(--color-accent-primary);
  color: #ffffff;
  opacity: 0.5;
}

/* GitHub风格卡片 */
.github-card {
  background-color: var(--color-bg-primary);
  border-radius: var(--card-radius);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  padding: 16px;
  transition: border-color var(--transition-time),
    box-shadow var(--transition-time), background-color var(--transition-time);
}

.github-card:hover {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 1px var(--color-accent-primary);
}

/* 图片和媒体在暗色模式下的优化 */
.dark img:not([src*=".svg"]) {
  filter: brightness(0.9) contrast(1.1);
  transition: filter var(--transition-time) ease;
}

.dark video,
.dark iframe {
  filter: brightness(0.9);
  transition: filter var(--transition-time) ease;
}

/* 针对图表和数据可视化组件的优化 */
.dark .chart,
.dark .visualization,
.dark .diagram {
  filter: hue-rotate(180deg) invert(0.2) brightness(1.1);
  transition: filter var(--transition-time) ease;
}

/* 输入元素聚焦状态的高亮效果 */
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 1px;
  transition: outline-color var(--transition-time) ease;
}

/* 按钮悬停和聚焦状态 */
button:not([disabled]):hover,
a.button:hover,
input[type="button"]:not([disabled]):hover,
input[type="submit"]:not([disabled]):hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  transition: filter var(--transition-time) ease,
    transform var(--transition-time) ease;
}

button:not([disabled]):active,
a.button:active,
input[type="button"]:not([disabled]):active,
input[type="submit"]:not([disabled]):active {
  filter: brightness(0.9);
  transform: translateY(1px);
}
</style>
