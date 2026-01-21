<script setup>
import { useProjectStore } from "@/stores/project";
import { useProfileStore } from "@/stores/profile";
import { storeToRefs } from "pinia";
import HomeSidebar from "@/components/HomeSidebar.vue";
import RepoCard from "@/components/RepoCard.vue";
import { onMounted, computed, ref } from "vue";
import { useSidebarStore } from "@/stores/sidebar";
import axios from "axios";

const projectStore = useProjectStore();
const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore);
// 是否正在加载
const isLoading = ref(false);
const sidebarStore = useSidebarStore();
const activeTab = ref("projects");

// 手动刷新相关状态
const isRefreshing = ref(false);
const refreshMessage = ref({ show: false, text: "", isError: false });

// 博客功能已删除
const recentPosts = computed(() => []);

// 获取热门项目（最多3个）- 使用 computed 属性，这样在 projects 更新时会自动重新计算
const topProjects = computed(() => {
  return projectStore.projects
    .slice()
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 3);
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// 从服务器获取GitHub Token
const getGithubTokenFromServer = async () => {
  try {
    const response = await axios.get(`${API_URL}/config`);
    if (response.data.success && response.data.data.github_token) {
      return response.data.data.github_token;
    }
  } catch (error) {
    console.error("获取GitHub Token失败:", error);
  }
  return "";
};

// 项目数据加载函数
const loadProjects = async () => {
  try {
    // 从服务器获取Token
    const token = await getGithubTokenFromServer();

    // 调用 API 获取数据
    await projectStore.fetchGitHubRepos(
      profileStore.profile.github_username,
      token
    );
    return projectStore.projects;
  } catch (error) {
    console.error("获取 GitHub 仓库失败:", error);
    return [];
  }
};

// 修改刷新数据函数
const refreshData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;

  try {
    // 刷新项目数据（博客功能已移除）
    await loadProjects();

    refreshMessage.value = {
      show: true,
      text: "数据刷新成功！",
      isError: false,
    };

    // 1秒后自动隐藏消息
    setTimeout(() => {
      refreshMessage.value.show = false;
    }, 1000);
  } catch (error) {
    refreshMessage.value = {
      show: true,
      text: `刷新失败: ${error.message}`,
      isError: true,
    };
  } finally {
    isRefreshing.value = false;
  }
};

// 初始化
onMounted(async () => {
  // 智能加载：只在没有数据或缓存过期时才加载
  if (projectStore.projects.length === 0 || projectStore.shouldRefresh()) {
    isLoading.value = true;
    try {
      await loadProjects();
    } catch (error) {
      console.error("初始加载数据失败:", error);
    } finally {
      isLoading.value = false;
    }
  } else {
    console.log('首页使用有效的缓存数据')
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
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">
            欢迎来到{{ profile.name }}的个人网站
          </h1>
          <button
            @click="refreshData"
            class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            :disabled="isRefreshing"
          >
            <svg
              v-if="isRefreshing"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span v-else class="mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </span>
            刷新
          </button>
        </div>

        <!-- 刷新状态消息 -->
        <div v-if="refreshMessage.show" class="mb-4">
          <div
            :class="[
              'p-3 rounded-md',
              refreshMessage.isError
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            ]"
          >
            <div class="flex items-center">
              <svg
                v-if="refreshMessage.isError"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{{ refreshMessage.text }}</span>
            </div>
          </div>
        </div>

        <!-- 最近文章 -->
        <section class="mb-10">
          <!-- 博客功能已移除，此区块不再展示 -->
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
