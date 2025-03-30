<script setup>
import { useBlogStore } from "@/stores/blog";
import { useProjectStore } from "@/stores/project";
import { useProfileStore } from "@/stores/profile";
import HomeSidebar from "@/components/HomeSidebar.vue";
import BlogCard from "@/components/BlogCard.vue";
import RepoCard from "@/components/RepoCard.vue";
import { onMounted, computed, ref } from "vue";

const blogStore = useBlogStore();
const projectStore = useProjectStore();
const profileStore = useProfileStore();
const { profile } = profileStore;
// 是否正在加载
const isLoading = ref(false);

// 获取最近的博客文章（最多3篇）
const recentPosts = blogStore.posts.slice(0, 3);

// 获取热门项目（最多3个）- 使用 computed 属性，这样在 projects 更新时会自动重新计算
const topProjects = computed(() => {
  return projectStore.projects
    .slice()
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 3);
});

// 在组件挂载时自动获取 GitHub 仓库数据
onMounted(async () => {
  try {
    isLoading.value = true;

    // 检查是否需要获取数据
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (
      projectStore.projects.length === 0 ||
      now - projectStore.lastFetchTime > oneHour
    ) {
      // 获取本地存储的 token（如果有）
      const token = localStorage.getItem("github_token") || "";

      // 调用 API 获取数据
      await projectStore.fetchGitHubRepos(
        profileStore.profile.github_username,
        token
      );
    }
  } catch (error) {
    console.error("获取 GitHub 仓库失败:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div
      class="grid grid-cols-1 md:grid-cols-4 gap-6"
      :class="{ 'md:grid-cols-[300px_1fr]': true }"
    >
      <!-- 侧边栏 - 主页使用特殊的永不折叠的侧边栏 -->
      <div>
        <HomeSidebar />
      </div>

      <!-- 主内容区 -->
      <div>
        <h1 class="text-2xl font-bold mb-6">
          欢迎来到{{ profile.name }}的个人网站
        </h1>

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
            <router-link
              to="/projects"
              class="text-github-blue hover:underline"
            >
              查看全部
            </router-link>
          </div>

          <!-- 错误提示 -->
          <div
            v-if="projectStore.error"
            class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 rounded-md mb-4"
          >
            <p class="text-red-600 dark:text-red-400 text-sm">
              {{ projectStore.error }}
            </p>
            <div class="mt-2 flex items-center justify-between">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                需要 GitHub Token 来解决 API 限制问题
              </p>
              <router-link
                to="/projects"
                class="text-xs bg-github-blue text-white px-3 py-1 rounded-md hover:bg-blue-700"
              >
                配置 Token
              </router-link>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-else-if="isLoading" class="py-4 flex justify-center">
            <div
              class="animate-spin h-6 w-6 border-4 border-github-blue border-t-transparent rounded-full"
            ></div>
          </div>

          <!-- 项目列表 -->
          <div v-else class="space-y-4">
            <div
              v-if="topProjects.length === 0"
              class="text-gray-500 py-4 text-center"
            >
              暂无项目数据
            </div>
            <RepoCard
              v-else
              v-for="project in topProjects"
              :key="project.id"
              :project="project"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
