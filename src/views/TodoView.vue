<script setup>
import Todo from '@/components/Todo.vue'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'
import { computed } from 'vue'

const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)
</script>

<template>
    <div class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6"
            :class="{ 'md:grid-cols-[300px_1fr]': !isCollapsed, 'md:grid-cols-[auto_1fr]': isCollapsed }">
            <!-- 侧边栏 -->
            <div>
                <ProfileSidebar />
            </div>

            <!-- 主内容区 -->
            <div>
                <h1 class="text-2xl font-bold mb-6">待办事项</h1>
                <Todo />
            </div>
        </div>
    </div>
</template>