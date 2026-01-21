<script setup>
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import Timeline from '@/components/Timeline.vue'
import TimelineEditor from '@/components/TimelineEditor.vue'
import { useSidebarStore } from '@/stores/sidebar'
import { computed, ref } from 'vue'

const profileStore = useProfileStore()
const authStore = useAuthStore()
const { profile } = storeToRefs(profileStore)

const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)

const showTimelineEditor = ref(false)
const dragIndex = ref(null)

function showContactInfo(type, value) {
    window.alert(`${type}: ${value}`);
}

const openTimelineEditor = () => {
    showTimelineEditor.value = true
}

const closeTimelineEditor = () => {
    showTimelineEditor.value = false
}

const onTimelineSaved = () => {
    console.log('Timeline saved successfully')
}

const onDragStart = (event, index) => {
    dragIndex.value = index
    if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
    }
}

const onDrop = async (index) => {
    if (dragIndex.value === null) return
    const fromIndex = dragIndex.value
    dragIndex.value = null
    if (fromIndex === index) return

    const previousSkills = [...profile.value.skills]
    const nextSkills = [...previousSkills]
    const [moved] = nextSkills.splice(fromIndex, 1)
    nextSkills.splice(index, 0, moved)
    profile.value.skills = nextSkills

    try {
        await profileStore.updateSkills(nextSkills)
    } catch (error) {
        profile.value.skills = previousSkills
        console.error(error)
    }
}

const onDragEnd = () => {
    dragIndex.value = null
}
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
                <h1 class="text-2xl font-bold mb-6">个人简历</h1>

                <!-- 个人信息概述 -->
                <section class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">个人简介</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 class="font-medium mb-2">联系方式</h3>
                            <ul class="space-y-2">
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>{{ profile.email }}</span>
                                </li>
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{{ profile.location }}</span>
                                </li>
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2"
                                        viewBox="0 0 1024 1024" fill="currentColor">
                                        <path
                                            d="M485.2 661.4c4.3 2 9.3 2 13.6 0l232-110V709c0 6.1-3.4 11.6-8.8 14.3L499.1 835.6c-4.5 2.3-9.8 2.3-14.2 0L202.7 723.4c-5.4-2.7-8.8-8.2-8.8-14.3V551.4l291.3 110z m344.3-289.8v436.1c0 16.4-13.3 29.7-29.7 29.7s-29.7-13.3-29.7-29.7V383.8l-39.4 9.2v109.4L492 615.6 193.9 502.4v-113l-77.3-24.9c-6.1-2.4-10.2-8.3-10.2-14.9s4-12.5 10.2-14.9L486.1 187c3.8-1.5 8-1.5 11.7 0l369.6 147.7c6.1 2.4 10.1 8.3 10.1 14.9s-4 12.5-10.1 14.9l-37.9 7.1z"
                                        />
                                    </svg>
                                    <span>{{ profile.company }}</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-medium mb-2">在线链接</h3>
                            <ul class="space-y-2">
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path
                                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <a :href="profile.github" target="_blank" rel="noopener noreferrer"
                                        class="text-[var(--color-link)] hover:underline">GitHub</a>
                                </li>
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg
                                        class="h-4 w-4 mr-2"
                                        viewBox="0 0 1024 1024"
                                        fill="currentColor"
                                        aria-hidden="true"
                                        style="transform: scale(1.2)"
                                    >
                                        <path
                                            d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"
                                        />
                                    </svg>
                                    <a href="#" class="text-[var(--color-link)] hover:underline"
                                        @click.prevent="showContactInfo('QQ', profile.qq)">QQ</a>
                                </li>
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.325.325 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.988 5.853-1.763-.45-3.418-3.931-6.423-8.596-6.423zm-1.527 3.577a1.048 1.048 0 11-.004 2.096 1.048 1.048 0 01.004-2.096zm4.988 0a1.048 1.048 0 11-.005 2.096 1.048 1.048 0 01.005-2.096zM24 14.875c0-3.421-3.384-6.188-7.56-6.188-4.177 0-7.56 2.767-7.56 6.188 0 3.42 3.383 6.186 7.56 6.186.843 0 1.656-.144 2.418-.39a.679.679 0 01.558.07l1.5.83a.368.368 0 00.167.047.305.305 0 00.291-.306c0-.055-.012-.109-.036-.164l-.316-1.094a.672.672 0 01.193-.641A5.909 5.909 0 0024 14.875zm-10.001-1.08a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55zm4.984 0a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55z" />
                                    </svg>
                                    <a href="#" class="text-[var(--color-link)] hover:underline"
                                        @click.prevent="showContactInfo('微信', profile.wechat)">微信</a>
                                </li>
                                <li class="flex items-center text-[var(--color-text-secondary)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <a :href="profile.website" target="_blank" rel="noopener noreferrer"
                                        class="text-[var(--color-link)] hover:underline">个人网站</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <h3 class="font-medium mt-6 mb-2">专业技能</h3>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="(skill, index) in profile.skills" :key="skill"
                            class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer select-none"
                            :class="dragIndex === index ? 'opacity-60' : ''"
                            draggable="true"
                            @dragstart="onDragStart($event, index)"
                            @dragover.prevent
                            @drop="onDrop(index)"
                            @dragend="onDragEnd">
                            {{ skill }}
                        </span>
                    </div>
                </section>

                <!-- 时间轴 -->
                <div class="relative">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">个人经历</h2>
                        <button v-if="authStore.isAuthenticated" @click="openTimelineEditor"
                            class="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            编辑时间轴
                        </button>
                    </div>
                    <Timeline />
                </div>
            </div>
        </div>
    </div>

    <!-- 时间轴编辑器 -->
    <TimelineEditor v-if="showTimelineEditor" @close="closeTimelineEditor" @saved="onTimelineSaved" />
</template>
