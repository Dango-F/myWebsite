<script setup>
import { useBlogStore } from '@/stores/blog'
import { useProjectStore } from '@/stores/project'
import { useProfileStore } from '@/stores/profile'
import HomeSidebar from '@/components/HomeSidebar.vue'
import BlogCard from '@/components/BlogCard.vue'
import RepoCard from '@/components/RepoCard.vue'
import { onMounted } from 'vue'

const blogStore = useBlogStore()
const projectStore = useProjectStore()
const profileStore = useProfileStore()

// 获取最近的博客文章（最多3篇）
const recentPosts = blogStore.posts.slice(0, 3)

// 获取热门项目（最多3个）
const topProjects = projectStore.projects
  .slice()
  .sort((a, b) => b.stars - a.stars)
  .slice(0, 3)

// 在组件挂载时自动获取 GitHub 仓库数据
onMounted(async () => {
  // 检查是否需要刷新数据（这里设置为1小时刷新一次）
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  if (now - projectStore.lastFetchTime > oneHour) {
    await projectStore.fetchGitHubRepos(profileStore.profile.github_username)
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6" :class="{ 'md:grid-cols-[300px_1fr]': true }">
      <!-- 侧边栏 - 主页使用特殊的永不折叠的侧边栏 -->
      <div>
        <HomeSidebar />
      </div>

      <!-- 主内容区 -->
      <div>
        <h1 class="text-2xl font-bold mb-6">欢迎来到YukiDango的个人网站</h1>

        <!-- 最近文章 -->
        <section class="mb-10">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">最近文章</h2>
            <router-link to="/blog" class="text-github-blue hover:underline">
              查看全部
            </router-link>
          </div>

          <div class="space-y-4">
            <BlogCard v-for="post in recentPosts" :key="post.id" :post="post" />
          </div>
        </section>

        <!-- 热门项目 -->
        <section>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">热门项目</h2>
            <router-link to="/projects" class="text-github-blue hover:underline">
              查看全部
            </router-link>
          </div>

          <div class="space-y-4">
            <RepoCard v-for="project in topProjects" :key="project.id" :project="project" />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
