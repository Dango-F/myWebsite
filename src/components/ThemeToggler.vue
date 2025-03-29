<script setup>
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

// 切换主题
const toggleTheme = () => {
    themeStore.toggleTheme();
};
</script>

<template>
    <button @click="toggleTheme"
        class="p-2.5 rounded-md transition-all duration-300 ease-in-out hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] relative overflow-hidden group"
        aria-label="切换主题" :title="themeStore.theme === 'light' ? '切换到深色模式' : '切换到浅色模式'">
        <div class="relative z-10">
            <!-- 浅色模式图标 -->
            <svg v-if="themeStore.theme === 'light'"
                class="h-5 w-5 transition-transform duration-300 ease-in-out transform group-hover:rotate-12"
                viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path
                    d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-1.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm7.737-13.364a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.061-1.06l1.06-1.06a.75.75 0 0 1 1.061 0ZM2.323 2.323a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.061l-1.06-1.06a.75.75 0 0 1 0-1.06Z">
                </path>
            </svg>
            <!-- 深色模式图标 -->
            <svg v-else class="h-5 w-5 transition-transform duration-300 ease-in-out transform group-hover:rotate-12"
                viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path
                    d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z">
                </path>
            </svg>
        </div>
        <!-- 悬停时的背景效果 -->
        <span
            class="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] opacity-0 group-hover:opacity-10 transition-opacity duration-300 ease-in-out"></span>
    </button>
</template>

<style scoped>
button {
    cursor: pointer;
}
</style>