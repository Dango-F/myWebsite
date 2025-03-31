<script setup>
import { computed, onMounted, onActivated, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBlogStore } from "@/stores/blog";
import ProfileSidebar from "@/components/ProfileSidebar.vue";
import { renderMarkdown } from "@/utils/markdown";
import { useSidebarStore } from "@/stores/sidebar";

const route = useRoute();
const router = useRouter();
const blogStore = useBlogStore();
const sidebarStore = useSidebarStore();

// 刷新状态
const isRefreshing = ref(false);
const refreshMessage = ref({ show: false, text: "", isError: false });

// 强制刷新当前文章数据
const refreshCurrentPost = async () => {
  if (route.params.id) {
    isRefreshing.value = true;
    refreshMessage.value = {
      show: true,
      text: "正在刷新文章数据...",
      isError: false,
    };

    try {
      // 先尝试使用智能刷新获取文章列表
      await blogStore.smartRefresh();

      // 然后只在必要时获取具体文章详情
      const existingPost = blogStore.posts.find(
        (p) => p._id === route.params.id || p.id?.toString() === route.params.id
      );

      if (!existingPost) {
        // 如果文章列表中没有找到，才单独获取文章
        await blogStore.fetchPost(route.params.id, true); // 强制刷新
      }

      refreshMessage.value = {
        show: true,
        text: "文章数据已更新！",
        isError: false,
      };

      // 3秒后自动隐藏消息
      setTimeout(() => {
        refreshMessage.value.show = false;
      }, 3000);
    } catch (error) {
      refreshMessage.value = {
        show: true,
        text: `刷新失败: ${error.message}`,
        isError: true,
      };
    } finally {
      isRefreshing.value = false;
    }
  }
};

// 初始加载和每次激活页面时刷新数据
onMounted(refreshCurrentPost);
onActivated(refreshCurrentPost);

const post = computed(() => {
  // 不要将ID转换为整数，直接使用原始ID（可能是MongoDB ObjectId）
  const foundPost = blogStore.getPostById(route.params.id);
  console.log("文章详细内容:", foundPost); // 添加调试日志

  // 如果文章不存在或状态不是published，则跳转到博客列表页
  if (!foundPost || foundPost.status !== "published") {
    router.push("/blog");
    return null;
  }

  return foundPost;
});

const renderedContent = computed(() => {
  if (!post.value) return "";
  // 优先使用html_content字段，如果没有则渲染content
  console.log(
    "文章渲染内容:",
    post.value.html_content ? "使用html_content" : "使用content渲染"
  );
  return post.value.html_content || renderMarkdown(post.value.content);
});

const isCollapsed = computed(() => sidebarStore.isCollapsed);
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div
      class="grid grid-cols-1 md:grid-cols-4 gap-6"
      :class="{
        'md:grid-cols-[300px_1fr]': !isCollapsed,
        'md:grid-cols-[auto_1fr]': isCollapsed,
      }"
    >
      <!-- 侧边栏 -->
      <div>
        <ProfileSidebar />
      </div>

      <!-- 主内容区 -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <router-link
            to="/blog"
            class="inline-flex items-center text-github-gray hover:text-github-blue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回博客列表
          </router-link>

          <button
            @click="refreshCurrentPost"
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

        <article
          class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md p-6"
        >
          <header class="mb-6 border-b border-[var(--color-border)] pb-4">
            <h1 class="text-2xl font-bold mb-2">{{ post.title }}</h1>
            <div class="flex items-center text-github-gray text-sm">
              <span>{{ post.date }}</span>
              <span class="mx-2">•</span>
              <router-link
                :to="`/blog/category/${
                  typeof post.category === 'object'
                    ? post.category.name
                    : post.category
                }`"
                class="hover:text-github-blue"
              >
                {{
                  typeof post.category === "object"
                    ? post.category.name
                    : post.category
                }}
              </router-link>
            </div>
          </header>

          <div
            class="markdown-body prose dark:prose-invert max-w-none"
            v-html="renderedContent"
          ></div>

          <footer class="mt-6 pt-4 border-t border-[var(--color-border)]">
            <div class="flex flex-wrap gap-2">
              <router-link
                v-for="tag in post.tags"
                :key="typeof tag === 'object' ? tag._id : tag"
                :to="`/blog/tag/${typeof tag === 'object' ? tag.name : tag}`"
                class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {{ typeof tag === "object" ? tag.name : tag }}
              </router-link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  </div>
</template>

<style>
/* GitHub风格Markdown内容样式 */
.markdown-body {
  color: var(--color-text-primary);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  padding-bottom: 0.3em;
  font-size: 2em;
  border-bottom: 1px solid var(--color-border);
}

.markdown-body h2 {
  padding-bottom: 0.3em;
  font-size: 1.5em;
  border-bottom: 1px solid var(--color-border);
}

.markdown-body pre {
  padding: 16px;
  overflow: auto;
  border-radius: 6px;
}

.dark .hljs {
  background: #161b22;
}
</style>
