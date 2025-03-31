import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useProjectStore = defineStore('project', () => {
    // 尝试从本地存储中恢复项目数据
    const loadStoredProjects = () => {
        try {
            const storedProjects = localStorage.getItem('github_projects')
            if (storedProjects) {
                return JSON.parse(storedProjects)
            }
        } catch (e) {
            console.error('从本地存储加载项目失败:', e)
        }
        return []
    }

    // 移除默认项目，使用空数组或本地存储的数据
    const projects = ref(loadStoredProjects())

    // 监听项目变化，保存到本地存储
    watch(projects, (newProjects) => {
        try {
            localStorage.setItem('github_projects', JSON.stringify(newProjects))
        } catch (e) {
            console.error('保存项目到本地存储失败:', e)
        }
    }, { deep: true })

    const tags = computed(() => {
        const tagSet = new Set()
        projects.value.forEach(project => project.tags.forEach(tag => tagSet.add(tag)))
        return [...tagSet]
    })

    const languages = computed(() => {
        const languageSet = new Set()
        projects.value.forEach(project => languageSet.add(project.language))
        return [...languageSet]
    })

    const getProjectsByTag = (tag) => {
        if (!tag) return projects.value
        return projects.value.filter(project => project.tags.includes(tag))
    }

    const getProjectsByLanguage = (language) => {
        if (!language) return projects.value
        return projects.value.filter(project => project.language === language)
    }

    // 是否正在加载
    const loading = ref(false)
    // 是否加载出错
    const error = ref(null)
    // 最后一次API调用的时间戳
    const lastFetchTime = ref(localStorage.getItem('github_last_fetch') || 0)

    // 从GitHub API获取仓库
    const fetchGitHubRepos = async (username, token = '') => {
        if (!username) return

        loading.value = true
        error.value = null

        try {
            // 构建API请求URL
            const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`

            // 准备请求头
            const headers = {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'MyBlog-App'
            }

            // 如果提供了令牌，添加到请求头
            if (token) {
                headers['Authorization'] = `token ${token}`
            }

            const response = await fetch(apiUrl, { headers })

            if (!response.ok) {
                // 针对特定状态码提供更具体的错误信息
                if (response.status === 403) {
                    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
                    if (rateLimitRemaining === '0') {
                        // 如果是因为超出速率限制而获得403
                        const resetTime = response.headers.get('X-RateLimit-Reset')
                        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleString() : '一段时间后'
                        throw new Error(`GitHub API 速率限制已达到，请在 ${resetDate} 后重试或添加访问令牌`)
                    } else {
                        throw new Error(`GitHub API 请求失败: 403 禁止访问，请尝试使用访问令牌`)
                    }
                } else if (response.status === 404) {
                    throw new Error(`GitHub API 请求失败: 找不到用户 "${username}"`)
                } else {
                    throw new Error(`GitHub API 请求失败: ${response.status}`)
                }
            }

            const data = await response.json()

            // 如果没有项目
            if (data.length === 0) {
                projects.value = []
                return []
            }

            // 将GitHub仓库数据转换为项目格式
            const githubProjects = data.map((repo, index) => ({
                id: index + 1,
                name: repo.name,
                description: repo.description || `${repo.name} 仓库`,
                language: repo.language || 'Other',
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                url: repo.html_url,
                tags: [repo.language || 'Other', 'GitHub'],
                isFromGitHub: true,
                updated_at: repo.updated_at,
                created_at: repo.created_at
            }))

            // 直接设置项目列表，不合并本地项目
            projects.value = [...githubProjects]

            // 更新最后一次API调用的时间戳
            lastFetchTime.value = Date.now()
            localStorage.setItem('github_last_fetch', lastFetchTime.value)

            return githubProjects
        } catch (err) {
            console.error('获取GitHub仓库失败:', err)
            error.value = err.message
            return []
        } finally {
            loading.value = false
        }
    }

    // 清除本地缓存的项目
    const clearCachedProjects = () => {
        localStorage.removeItem('github_projects')
        localStorage.removeItem('github_last_fetch')
        projects.value = []
        lastFetchTime.value = 0
    }

    // 检查是否需要刷新项目数据
    const shouldRefresh = () => {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1小时

        // 如果没有数据或者上次加载时间超过1小时，需要刷新
        return (
            projects.value.length === 0 ||
            now - lastFetchTime.value > oneHour
        );
    }

    return {
        projects,
        tags,
        languages,
        loading,
        error,
        lastFetchTime,
        getProjectsByTag,
        getProjectsByLanguage,
        fetchGitHubRepos,
        clearCachedProjects,
        shouldRefresh
    }
}) 