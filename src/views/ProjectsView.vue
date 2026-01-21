<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import RepoCard from '@/components/RepoCard.vue'
import { useSidebarStore } from '@/stores/sidebar'
import axios from 'axios'

const projectStore = useProjectStore()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const { profile } = storeToRefs(profileStore)
const tagFilter = ref('')
const languageFilter = ref('')
const searchQuery = ref('')
// 使用 ref 存储 GitHub 用户名,允许用户临时修改
const githubUsername = ref(profile.value.github_username)
const githubToken = ref('')
const showTokenInput = ref(false)
const hasConfiguredToken = ref(false)
const isEditingToken = ref(false)
const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)
const isLoadingToken = ref(false)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

// 从服务器加载GitHub Token
const loadGitHubTokenFromServer = async () => {
    try {
        isLoadingToken.value = true;
        const response = await axios.get(`${API_URL}/config`);

        if (response.data.success && response.data.data.github_token) {
            githubToken.value = response.data.data.github_token;
            hasConfiguredToken.value = true;
            isEditingToken.value = false;
            
            // 智能加载：只在必要时才调用 API
            // 1. 没有缓存数据时
            // 2. 缓存已过期（超过1小时）时
            if (projectStore.projects.length === 0 || projectStore.shouldRefresh()) {
                console.log('缓存无效或已过期，从 GitHub API 加载数据')
                await loadGitHubRepos();
            } else {
                console.log('使用有效的缓存数据，最后更新于:', 
                    new Date(parseInt(projectStore.lastFetchTime)).toLocaleString())
            }
        }
    } catch (error) {
        console.error('加载GitHub Token失败:', error);
        hasConfiguredToken.value = false;
    } finally {
        isLoadingToken.value = false;
    }
};

// 将GitHub Token保存到服务器
const saveGitHubTokenToServer = async (token) => {
    try {
        await axios.post(`${API_URL}/config/github-token`, { token });
        hasConfiguredToken.value = true;
        isEditingToken.value = false;
        // 保存成功后立即刷新
        await loadGitHubRepos();
    } catch (error) {
        console.error('保存GitHub Token失败:', error);
    }
};

// 修改加载GitHub仓库函数
const loadGitHubRepos = async () => {
    if (githubUsername.value && githubToken.value) {
        // 调用API时传入令牌
        await projectStore.fetchGitHubRepos(githubUsername.value, githubToken.value);
    }
};

// 应用GitHub Token
const applyGitHubToken = async () => {
    if (githubToken.value) {
        // 只保存到服务器，不保存到localStorage
        await saveGitHubTokenToServer(githubToken.value);
        showTokenInput.value = false;
    }
};

// 开始编辑新令牌
const startEditToken = () => {
    isEditingToken.value = true;
    githubToken.value = '';
};

// 取消编辑
const cancelEditToken = () => {
    isEditingToken.value = false;
    githubToken.value = '';
};

// 清除缓存并重新加载（已移除，功能合并到刷新按钮）

// 切换令牌输入框的显示/隐藏
const toggleTokenInput = () => {
    showTokenInput.value = !showTokenInput.value;
    isEditingToken.value = false;
    // 如果隐藏输入框，重新从服务器加载Token
    if (!showTokenInput.value) {
        loadGitHubTokenFromServer();
    }
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

// 监听 profile.github_username 的变化,同步到本地 githubUsername
watch(() => profile.value.github_username, (newUsername) => {
    if (newUsername && newUsername !== githubUsername.value) {
        githubUsername.value = newUsername
    }
})

// 修改onMounted钩子
onMounted(async () => {
    // 先尝试从服务器加载令牌
    await loadGitHubTokenFromServer();
});
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

                        <button v-if="authStore.isAuthenticated" @click="toggleTokenInput" type="button"
                            class="px-2 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-md border border-[var(--color-border)] hover:bg-gray-200 dark:hover:bg-gray-800"
                            :title="hasConfiguredToken ? 'GitHub访问令牌已配置（点击修改）' : 'GitHub访问令牌（未配置）'">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" :class="{ 'text-green-500': hasConfiguredToken }">
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
                <div v-if="projectStore.lastFetchTime" class="text-sm text-github-gray mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>最后更新: {{ lastUpdateTime }}</span>
                </div>

                <!-- GitHub令牌输入框 -->
                <div v-if="showTokenInput"
                    class="mb-4 p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
                    <div class="flex flex-col space-y-2">
                        <label for="github-token" class="text-sm font-medium">
                            GitHub访问令牌 <span class="text-xs text-gray-500">(解决API限制问题)</span>
                        </label>

                        <!-- 已配置令牌状态 -->
                        <div v-if="hasConfiguredToken && !isEditingToken" class="flex flex-col space-y-2">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2"
                                        viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clip-rule="evenodd" />
                                    </svg>
                                    <span class="text-green-600 font-medium">GitHub令牌已配置</span>
                                </div>
                                <div class="flex gap-2">
                                    <button @click="startEditToken"
                                        class="px-3 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700">
                                        更新令牌
                                    </button>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500">
                                令牌已安全地存储在服务器中。出于安全考虑，不会显示现有令牌的值。如需更改，请点击"更新令牌"按钮。
                            </p>
                        </div>

                        <!-- 令牌输入表单 -->
                        <div v-else class="flex flex-col space-y-2">
                            <div class="flex gap-2">
                                <input id="github-token" v-model="githubToken" type="password"
                                    placeholder="输入GitHub个人访问令牌"
                                    class="flex-1 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                                <button @click="applyGitHubToken"
                                    class="px-3 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700">
                                    应用
                                </button>
                                <button v-if="isEditingToken" @click="cancelEditToken"
                                    class="px-3 py-2 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                                    取消
                                </button>
                            </div>
                            <p class="text-xs text-gray-500">
                                如果遇到API限制错误，请<a href="https://github.com/settings/tokens" target="_blank"
                                    class="text-github-blue hover:underline">创建个人访问令牌</a>（无需勾选任何权限）。令牌将安全存储在服务器中。
                            </p>
                        </div>
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