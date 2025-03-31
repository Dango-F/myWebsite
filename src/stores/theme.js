import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // 检查用户是否曾经设置过主题偏好
    const savedTheme = localStorage.getItem('theme');
    // 默认使用黑暗模式，不再检查系统偏好
    const theme = ref(savedTheme || 'dark');

    // 切换主题
    const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
        localStorage.setItem('theme', theme.value)
    }

    // 设置特定主题
    const setTheme = (newTheme) => {
        if (newTheme === 'light' || newTheme === 'dark') {
            theme.value = newTheme;
            localStorage.setItem('theme', newTheme);
        }
    }

    // 监听主题变化，应用相应的类
    watch(theme, (newTheme) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }, { immediate: true });

    return { theme, toggleTheme, setTheme }
}) 