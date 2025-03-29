import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // 检查用户是否曾经设置过主题偏好
    const savedTheme = localStorage.getItem('theme');
    // 如果没有设置过，检查系统偏好
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // 初始化主题设置
    const theme = ref(savedTheme || (prefersDark ? 'dark' : 'light'));

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

    // 跟踪系统主题变化（如果用户选择了"自动"）
    const setupSystemThemeListener = () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // 只有在用户没有明确设置主题时才跟随系统
            if (!localStorage.getItem('theme')) {
                theme.value = e.matches ? 'dark' : 'light';
            }
        };

        // 添加监听器
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // 旧版本浏览器兼容
            mediaQuery.addListener(handleChange);
        }
    };

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

    // 初始化时设置系统主题监听
    if (typeof window !== 'undefined') {
        setupSystemThemeListener();
    }

    return { theme, toggleTheme, setTheme }
}) 