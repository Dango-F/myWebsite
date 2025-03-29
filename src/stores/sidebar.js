import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
    // 侧边栏折叠状态，默认为展开
    const isCollapsed = ref(false)

    // 切换侧边栏折叠状态
    function toggleSidebar() {
        isCollapsed.value = !isCollapsed.value
    }

    return {
        isCollapsed,
        toggleSidebar
    }
}) 