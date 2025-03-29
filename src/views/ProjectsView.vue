<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useProfileStore } from '@/stores/profile'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import RepoCard from '@/components/RepoCard.vue'
import { useSidebarStore } from '@/stores/sidebar'

const projectStore = useProjectStore()
const profileStore = useProfileStore()
const tagFilter = ref('')
const languageFilter = ref('')
const searchQuery = ref('')
const githubUsername = ref('')
const githubToken = ref('')
const showTokenInput = ref(false)
const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)

// 计算最后更新时间的友好显示
const lastUpdateTime = computed(() => {
    if (!projectStore.lastFetchTime) return '未获取过数据'

    const lastFetch = new Date(parseInt(projectStore.lastFetchTime))
    const now = new Date()
    const diff = Math.floor((now - lastFetch) / 1000) // 差异秒数

    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`

    // 格式化日期
    return lastFetch.toLocaleString()
})

// 从本地存储加载Token
onMounted(() => {
    const savedToken = localStorage.getItem('github_token')
    if (savedToken) {
        githubToken.value = savedToken
    }
})

// 从GitHub用户名中提取用户名并检查是否需要加载仓库
onMounted(() => {
    if (profileStore.profile.github) {
        const urlParts = profileStore.profile.github.split('/')
        githubUsername.value = urlParts[urlParts.length - 1] || 'Dango-F'
    }
})

// 加载GitHub仓库
const loadGitHubRepos = async () => {
    if (githubUsername.value) {
        // 如果提供了令牌，保存它
        if (githubToken.value) {
            localStorage.setItem('github_token', githubToken.value)
        }

        // 调用API时传入令牌
        await projectStore.fetchGitHubRepos(githubUsername.value, githubToken.value)
    }
}

// 清除缓存并重新加载
const clearCacheAndReload = async () => {
    projectStore.clearCachedProjects()
    await loadGitHubRepos()
}

// 切换令牌输入框的显示/隐藏
const toggleTokenInput = () => {
    showTokenInput.value = !showTokenInput.value
}

const filteredProjects = computed(() => {
    let result = projectStore.projects

    // 按标签过滤
    if (tagFilter.value) {
        result = result.filter(project => project.tags.includes(tagFilter.value))
    }

    // 按语言过滤
    if (languageFilter.value) {
        result = result.filter(project => project.language === languageFilter.value)
    }

    // 按搜索查询过滤
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter(project =>
            project.name.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query)
        )
    }

    // 按星标降序排序
    return result.slice().sort((a, b) => b.stars - a.stars)
})
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
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold">项目</h1>

                    <!-- GitHub用户名输入 -->
                    <div class="flex items-center gap-2">
                        <input v-model="githubUsername" type="text" placeholder="GitHub用户名"
                            class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />

                        <button @click="toggleTokenInput" type="button"
                            class="px-2 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-md border border-[var(--color-border)] hover:bg-gray-200 dark:hover:bg-gray-800"
                            title="GitHub访问令牌">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </button>

                        <button @click="loadGitHubRepos"
                            class="px-3 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700"
                            :disabled="projectStore.loading">
                            <span v-if="projectStore.loading">获取中...</span>
                            <span v-else>刷新</span>
                        </button>
                    </div>
                </div>

                <!-- 最后更新时间 -->
                <div class="flex justify-between items-center mb-4 text-sm">
                    <div class="flex items-center text-github-gray">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>最后更新: {{ lastUpdateTime }}</span>
                    </div>
                    <button v-if="projectStore.lastFetchTime" @click="clearCacheAndReload"
                        class="text-github-blue hover:underline flex items-center" title="清除缓存并重新加载">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>清除缓存</span>
                    </button>
                </div>

                <!-- GitHub令牌输入框 -->
                <div v-if="showTokenInput"
                    class="mb-4 p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
                    <div class="flex flex-col space-y-2">
                        <label for="github-token" class="text-sm font-medium">
                            GitHub访问令牌 <span class="text-xs text-gray-500">(解决API限制问题)</span>
                        </label>
                        <div class="flex gap-2">
                            <input id="github-token" v-model="githubToken" type="password" placeholder="输入GitHub个人访问令牌"
                                class="flex-1 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                            <button @click="loadGitHubRepos"
                                class="px-3 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700">
                                应用
                            </button>
                        </div>
                        <p class="text-xs text-gray-500">
                            如果遇到API限制错误，请<a href="https://github.com/settings/tokens" target="_blank"
                                class="text-github-blue hover:underline">创建个人访问令牌</a>（无需勾选任何权限）。令牌将存储在本地浏览器中。
                        </p>
                    </div>
                </div>

                <!-- 错误提示 -->
                <p v-if="projectStore.error" class="mt-2 text-red-500 text-sm mb-4">
                    {{ projectStore.error }}
                </p>

                <!-- 加载状态 -->
                <div v-if="projectStore.loading" class="flex justify-center my-10">
                    <div class="animate-spin h-8 w-8 border-4 border-github-blue border-t-transparent rounded-full">
                    </div>
                </div>

                <!-- 提示用户加载数据 -->
                <div v-else-if="projectStore.projects.length === 0 && !projectStore.lastFetchTime"
                    class="text-center py-10">
                    <p class="text-github-gray mb-4">尚未加载任何项目数据</p>
                    <button @click="loadGitHubRepos"
                        class="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700">
                        从GitHub获取仓库
                    </button>
                </div>

                <!-- 过滤器和搜索 -->
                <div v-else-if="projectStore.projects.length > 0" class="mb-6 flex flex-col space-y-4">
                    <input v-model="searchQuery" type="text" placeholder="搜索项目..."
                        class="p-2 w-full border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />

                    <div class="flex flex-wrap gap-2">
                        <div>
                            <select v-model="languageFilter"
                                class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]">
                                <option value="">所有语言</option>
                                <option v-for="language in projectStore.languages" :key="language" :value="language">
                                    {{ language }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <select v-model="tagFilter"
                                class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]">
                                <option value="">所有标签</option>
                                <option v-for="tag in projectStore.tags" :key="tag" :value="tag">
                                    {{ tag }}
                                </option>
                            </select>
                        </div>

                        <button v-if="languageFilter || tagFilter || searchQuery"
                            @click="languageFilter = ''; tagFilter = ''; searchQuery = ''"
                            class="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                            清除过滤
                        </button>
                    </div>
                </div>

                <!-- 项目列表 -->
                <div v-if="!projectStore.loading && filteredProjects.length" class="space-y-4">
                    <RepoCard v-for="project in filteredProjects" :key="project.id" :project="project" />
                </div>
                <div v-else-if="!projectStore.loading && projectStore.projects.length > 0"
                    class="text-center py-10 text-github-gray">
                    没有找到符合条件的项目
                </div>
            </div>
        </div>
    </div>
</template>