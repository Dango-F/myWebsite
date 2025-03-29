<script setup>
import { useProfileStore } from '@/stores/profile'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import Timeline from '@/components/Timeline.vue'
import { useSidebarStore } from '@/stores/sidebar'
import { computed } from 'vue'

const profileStore = useProfileStore()
const { profile } = profileStore

const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)

function showContactInfo(type, value) {
    window.alert(`${type}: ${value}`);
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
                                <li class="flex items-center text-github-gray">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>{{ profile.email }}</span>
                                </li>
                                <li class="flex items-center text-github-gray">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{{ profile.location }}</span>
                                </li>
                                <li class="flex items-center text-github-gray">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{{ profile.company }}</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-medium mb-2">在线链接</h3>
                            <ul class="space-y-2">
                                <li class="flex items-center text-github-gray">
                                    <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path
                                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <a :href="profile.github" target="_blank" rel="noopener noreferrer"
                                        class="text-github-blue hover:underline">GitHub</a>
                                </li>
                                <li class="flex items-center text-github-gray">
                                    <svg class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.018-.236.028-.476.028-.715C19.541 4.403 16.205 1 12.03 1 7.856 1 4.52 4.402 4.52 9.361c0 .255.013.51.04.765a39.89 39.89 0 0 0-1.013 2.584 27.97 27.97 0 0 0-.86 2.33c-.696 2.348-.166 3.33.358 3.47.355.094 1.384-.286 2.312-1.426l.157-.195c.316 1.53 1.126 2.885 2.262 3.915a9.504 9.504 0 0 0 2.836 1.684 7.656 7.656 0 0 0 2.44.415l.62.002c3.15.023 6.058-1.664 7.535-4.303.737.867 1.462 1.275 1.736 1.19.52-.143 1.048-1.133.352-3.482zm-9.368 4.883l-.017-.006-.618.001a6.562 6.562 0 0 1-2.085-.354 8.408 8.408 0 0 1-2.509-1.492c-1.024-.927-1.73-2.089-1.97-3.235l-.159-.757-.598.485c-.28.228-.574.417-.868.566a5.815 5.815 0 0 1-.287.132 5.889 5.889 0 0 1 .157-.426c.071-.174.158-.344.262-.505.169-.261.382-.608.63-1.036a29.698 29.698 0 0 1 1.457-2.385c.31-2.086.8-3.694 1.407-4.315.197-.2.382-.299.548-.299.153 0 .261.059.35.106.239.126.404.328.493.603l.013.039.034.022c.107.07.319.208.514.462.156.204.324.496.324 1.08 0 .561-.223.845-.529 1.128-.112.104-.233.186-.235.187l-.307.186.352.043c.05.006.101.018.148.35.107.039.224.09.33.175.096.078.192.182.253.357l.23.066.058.036a.776.776 0 0 1 .112.082c.078.063.131.116.131.308l-.005.086.017.085a1.606 1.606 0 0 1-.009 1.002l-.069.18.147.126c.145.125.24.282.296.447.113.329.044.747-.061 1.039l-.054.15.117.104c.283.254.432.637.395 1.016a1.3 1.3 0 0 1-.392.845l-.073.067.003.099c0 .756-.127 1.985-.3 2.365-.465 1.675-2.493 3.165-5.196 3.165zm7.063-3.158c-.327.266-.656.467-.937.585l.042-.333c.042-.336-.024-.671-.184-.949.07-.28.113-.55.125-.81.161-.152.315-.36.397-.631.109-.365.09-.705.027-.918a1.684 1.684 0 0 0-.074-.217c.028-.134.05-.273.069-.414.069-.073.16-.195.24-.367.271.598.616 1.395.912 2.129l.7.173c.714 1.82.79 2.5.73 2.632-.023.048-.097.12-.397.12z" />
                                    </svg>
                                    <a href="#" class="text-github-blue hover:underline"
                                        @click.prevent="showContactInfo('QQ', profile.qq)">QQ</a>
                                </li>
                                <li class="flex items-center text-github-gray">
                                    <svg class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.325.325 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.988 5.853-1.763-.45-3.418-3.931-6.423-8.596-6.423zm-1.527 3.577a1.048 1.048 0 11-.004 2.096 1.048 1.048 0 01.004-2.096zm4.988 0a1.048 1.048 0 11-.005 2.096 1.048 1.048 0 01.005-2.096zM24 14.875c0-3.421-3.384-6.188-7.56-6.188-4.177 0-7.56 2.767-7.56 6.188 0 3.42 3.383 6.186 7.56 6.186.843 0 1.656-.144 2.418-.39a.679.679 0 01.558.07l1.5.83a.368.368 0 00.167.047.305.305 0 00.291-.306c0-.055-.012-.109-.036-.164l-.316-1.094a.672.672 0 01.193-.641A5.909 5.909 0 0024 14.875zm-10.001-1.08a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55zm4.984 0a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55z" />
                                    </svg>
                                    <a href="#" class="text-github-blue hover:underline"
                                        @click.prevent="showContactInfo('微信', profile.wechat)">微信</a>
                                </li>
                                <li class="flex items-center text-github-gray">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <a :href="profile.website" target="_blank" rel="noopener noreferrer"
                                        class="text-github-blue hover:underline">个人网站</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <h3 class="font-medium mt-6 mb-2">专业技能</h3>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="skill in profile.skills" :key="skill"
                            class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300">
                            {{ skill }}
                        </span>
                    </div>
                </section>

                <!-- 时间轴 -->
                <Timeline />
            </div>
        </div>
    </div>
</template>