<script setup>
import { ref, computed, onMounted, onActivated } from "vue";
import { useBlogStore } from "@/stores/blog";
import { useSidebarStore } from "@/stores/sidebar";
import ProfileSidebar from "@/components/ProfileSidebar.vue";
import BlogCard from "@/components/BlogCard.vue";

const blogStore = useBlogStore();
const sidebarStore = useSidebarStore();
const isCollapsed = computed(() => sidebarStore.isCollapsed);

const categoryFilter = ref("");
const tagFilter = ref("");
const searchQuery = ref("");

// 上传博客相关状态
const showUploadForm = ref(false);
const uploadedFile = ref(null);
const newCategory = ref("");
const newTags = ref("");
const uploadStatus = ref({ loading: false, message: "", isError: false });

// 批量上传相关
const showBatchUploadForm = ref(false);
const batchFiles = ref([]);
const batchUploadProgress = ref({ total: 0, current: 0 });
const batchCategory = ref("");
const batchTags = ref("");

// 添加手动刷新按钮
const isRefreshing = ref(false);
const uploadStatusTimeout = ref(null);

// 初始化加载数据
onMounted(async () => {
  // 使用智能刷新（首次加载）
  await blogStore.smartRefresh();
});

// 每次激活页面时按需刷新数据（如从其他页面导航过来）
onActivated(async () => {
  // 使用静默刷新，避免显示通知
  const posts = await blogStore.smartRefresh();
  // 不触发任何UI更新通知
});

const filteredPosts = computed(() => {
  let result = blogStore.posts;

  // 按分类过滤
  if (categoryFilter.value) {
    result = result.filter((post) => post.category === categoryFilter.value);
  }

  // 按标签过滤
  if (tagFilter.value) {
    result = result.filter((post) => post.tags.includes(tagFilter.value));
  }

  // 按搜索查询过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
    );
  }

  // 按日期降序排序（最新的在前面）
  return result.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
});

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.name.endsWith(".md") && file.type !== "text/markdown") {
      uploadStatus.value = {
        loading: false,
        message: "请选择Markdown文件 (.md)",
        isError: true,
      };
      return;
    }

    // 清除之前的状态消息（如果有）
    if (uploadStatus.value.message && !uploadStatus.value.isError) {
      uploadStatus.value = { loading: false, message: "", isError: false };
    }

    uploadedFile.value = file;
  }
};

// 处理多文件选择
const handleMultipleFilesChange = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    // 首先清除之前的成功状态消息
    if (uploadStatus.value.message && !uploadStatus.value.isError) {
      uploadStatus.value = { loading: false, message: "", isError: false };
    }

    // 过滤出所有.md文件
    const mdFiles = Array.from(files).filter(
      (file) => file.name.endsWith(".md") || file.type === "text/markdown"
    );

    if (mdFiles.length === 0) {
      uploadStatus.value = {
        loading: false,
        message: "没有找到Markdown文件",
        isError: true,
      };
      return;
    }

    batchFiles.value = mdFiles;
    uploadStatus.value = {
      loading: false,
      message: `已选择${mdFiles.length}个Markdown文件`,
      isError: false,
    };
  }
};

// 处理博客上传
const handleUpload = async () => {
  // 首先清除之前的任何状态消息
  clearTimeout(uploadStatusTimeout.value);

  if (!uploadedFile.value) {
    uploadStatus.value = {
      loading: false,
      message: "请先选择Markdown文件",
      isError: true,
    };
    return;
  }

  uploadStatus.value = { loading: true, message: "上传中...", isError: false };

  try {
    // 解析标签
    const tags = newTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    // 添加博客
    const post = await blogStore.addPostFromMarkdown(uploadedFile.value, {
      category: newCategory.value || "未分类",
      tags,
    });

    // 清空表单
    uploadedFile.value = null;
    newCategory.value = "";
    newTags.value = "";
    showUploadForm.value = false;

    // 更新状态
    uploadStatus.value = {
      loading: false,
      message: "博客上传成功！",
      isError: false,
    };

    // 3秒后清除状态信息
    uploadStatusTimeout.value = setTimeout(() => {
      uploadStatus.value = { loading: false, message: "", isError: false };
    }, 3000);
  } catch (error) {
    uploadStatus.value = {
      loading: false,
      message: `上传失败: ${error.message}`,
      isError: true,
    };
  }
};

// 批量上传博客
const handleBatchUpload = async () => {
  // 首先清除之前的任何状态消息
  clearTimeout(uploadStatusTimeout.value);

  if (batchFiles.value.length === 0) {
    uploadStatus.value = {
      loading: false,
      message: "请先选择Markdown文件",
      isError: true,
    };
    return;
  }

  uploadStatus.value = {
    loading: true,
    message: "开始批量上传...",
    isError: false,
  };
  batchUploadProgress.value = { total: batchFiles.value.length, current: 0 };

  // 解析标签
  const tags = batchTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);

  // 记录成功和失败的文件
  let successCount = 0;
  let failCount = 0;

  // 逐个处理文件
  for (const file of batchFiles.value) {
    try {
      batchUploadProgress.value.current++;
      uploadStatus.value = {
        loading: true,
        message: `正在处理 ${batchUploadProgress.value.current}/${batchUploadProgress.value.total}: ${file.name}`,
        isError: false,
      };

      await blogStore.addPostFromMarkdown(file, {
        category: batchCategory.value || "未分类",
        tags,
      });

      successCount++;
    } catch (error) {
      console.error(`上传 ${file.name} 失败:`, error);
      failCount++;
    }
  }

  // 清空表单
  batchFiles.value = [];
  batchCategory.value = "";
  batchTags.value = "";
  showBatchUploadForm.value = false;

  // 更新最终状态
  uploadStatus.value = {
    loading: false,
    message: `批量上传完成！成功: ${successCount}, 失败: ${failCount}`,
    isError: failCount > 0,
  };

  // 5秒后清除状态信息
  uploadStatusTimeout.value = setTimeout(() => {
    uploadStatus.value = { loading: false, message: "", isError: false };
  }, 5000);
};

// 取消上传
const cancelUpload = () => {
  uploadedFile.value = null;
  newCategory.value = "";
  newTags.value = "";
  showUploadForm.value = false;
  clearTimeout(uploadStatusTimeout.value);
  uploadStatus.value = { loading: false, message: "", isError: false };
};

// 取消批量上传
const cancelBatchUpload = () => {
  batchFiles.value = [];
  batchCategory.value = "";
  batchTags.value = "";
  showBatchUploadForm.value = false;
  clearTimeout(uploadStatusTimeout.value);
  uploadStatus.value = { loading: false, message: "", isError: false };
};

// 切换到单文件上传
const switchToSingleUpload = () => {
  showBatchUploadForm.value = false;
  showUploadForm.value = true;
  // 立即清除之前的状态消息
  uploadStatus.value = { loading: false, message: "", isError: false };
};

// 切换到批量上传
const switchToBatchUpload = () => {
  showUploadForm.value = false;
  showBatchUploadForm.value = true;
  // 立即清除之前的状态消息
  uploadStatus.value = { loading: false, message: "", isError: false };
};

// 添加手动刷新按钮
const refreshData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;

  // 清除之前的任何状态消息超时
  clearTimeout(uploadStatusTimeout.value);

  try {
    await blogStore.smartRefresh();
    uploadStatus.value = {
      loading: false,
      message: "博客数据刷新成功！",
      isError: false,
    };

    // 3秒后自动清除状态消息
    uploadStatusTimeout.value = setTimeout(() => {
      uploadStatus.value = { loading: false, message: "", isError: false };
    }, 3000);
  } catch (error) {
    uploadStatus.value = {
      loading: false,
      message: `刷新失败: ${error.message}`,
      isError: true,
    };

    // 失败消息也应该在5秒后消失
    uploadStatusTimeout.value = setTimeout(() => {
      uploadStatus.value = { loading: false, message: "", isError: false };
    }, 5000);
  } finally {
    isRefreshing.value = false;
  }
};

// 处理拖放功能
const handleDragOver = (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (!showUploadForm) return;

  // 添加拖放高亮效果
  event.target.closest(".drag-drop-zone")?.classList.add("drag-over");
};

const handleDragLeave = (event) => {
  event.preventDefault();
  event.stopPropagation();
  // 移除拖放高亮效果
  event.target.closest(".drag-drop-zone")?.classList.remove("drag-over");
};

const handleDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // 移除拖放高亮效果
  event.target.closest(".drag-drop-zone")?.classList.remove("drag-over");

  if (!showUploadForm.value) return;

  const file = event.dataTransfer.files[0];
  if (file) {
    if (!file.name.endsWith(".md") && file.type !== "text/markdown") {
      uploadStatus.value = {
        loading: false,
        message: "请选择Markdown文件 (.md)",
        isError: true,
      };
      return;
    }

    // 清除之前的状态消息（如果有）
    if (uploadStatus.value.message && !uploadStatus.value.isError) {
      uploadStatus.value = { loading: false, message: "", isError: false };
    }

    uploadedFile.value = file;
  }
};

// 批量上传的拖放处理
const handleBatchDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // 移除拖放高亮效果
  event.target.closest(".drag-drop-zone")?.classList.remove("drag-over");

  if (!showBatchUploadForm) return;

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    // 过滤出所有.md文件
    const mdFiles = Array.from(files).filter(
      (file) => file.name.endsWith(".md") || file.type === "text/markdown"
    );

    if (mdFiles.length === 0) {
      uploadStatus.value = {
        loading: false,
        message: "没有找到Markdown文件",
        isError: true,
      };
      return;
    }

    batchFiles.value = mdFiles;
    uploadStatus.value = {
      loading: false,
      message: `已选择${mdFiles.length}个Markdown文件`,
      isError: false,
    };
  }
};
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
        <div class="mb-6 flex justify-between items-center">
          <h1 class="text-2xl font-bold">博客</h1>
          <div class="flex gap-2">
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

            <button
              @click="switchToBatchUpload"
              v-if="!showUploadForm && !showBatchUploadForm"
              class="px-3 py-1 bg-github-green text-white rounded hover:bg-green-700 flex items-center"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                />
              </svg>
              <span>批量上传</span>
            </button>

            <button
              @click="switchToSingleUpload"
              v-if="!showUploadForm && !showBatchUploadForm"
              class="px-3 py-1 bg-github-blue text-white rounded hover:bg-blue-700 flex items-center"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>上传博客</span>
            </button>
          </div>
        </div>

        <!-- 上传状态消息 -->
        <div v-if="uploadStatus.message" class="mb-4">
          <div
            :class="[
              'p-3 rounded-md',
              uploadStatus.isError
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            ]"
          >
            <div class="flex items-center">
              <svg
                v-if="uploadStatus.isError"
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
              <span>{{ uploadStatus.message }}</span>
            </div>

            <!-- 进度条 -->
            <div
              v-if="uploadStatus.loading && batchUploadProgress.total > 0"
              class="mt-2"
            >
              <div
                class="h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden"
              >
                <div
                  class="h-full bg-github-blue dark:bg-blue-500"
                  :style="`width: ${
                    (batchUploadProgress.current / batchUploadProgress.total) *
                    100
                  }%`"
                ></div>
              </div>
              <div class="text-xs mt-1 text-right">
                {{ batchUploadProgress.current }}/{{
                  batchUploadProgress.total
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- 单文件上传表单 -->
        <div
          v-if="showUploadForm"
          class="mb-6 bg-[var(--color-bg-secondary)] p-4 rounded-md border border-[var(--color-border)]"
        >
          <h2 class="text-lg font-semibold mb-4">上传单个Markdown博客</h2>

          <div class="space-y-4">
            <!-- 文件上传 -->
            <div>
              <label for="markdown-file" class="block text-sm font-medium mb-1">
                Markdown文件 <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center">
                <label
                  for="markdown-file"
                  class="flex-1 cursor-pointer border border-dashed border-[var(--color-border)] rounded-md p-4 text-center hover:border-github-blue transition-colors drag-drop-zone"
                  @dragover="handleDragOver"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop"
                >
                  <input
                    type="file"
                    id="markdown-file"
                    class="hidden"
                    accept=".md,text/markdown"
                    @change="handleFileChange"
                  />
                  <div v-if="!uploadedFile" class="flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-10 w-10 text-github-gray mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span class="text-github-gray"
                      >点击上传或拖放Markdown文件</span
                    >
                  </div>
                  <div v-else class="flex items-center text-github-blue">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>{{ uploadedFile.name }}</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- 分类 -->
            <div>
              <label for="category" class="block text-sm font-medium mb-1"
                >分类</label
              >
              <input
                type="text"
                id="category"
                v-model="newCategory"
                placeholder="分类名称"
                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
              />
              <div
                class="mt-3 flex flex-wrap gap-2"
                v-if="blogStore.categories.length"
              >
                <span class="text-xs">现有分类:</span>
                <button
                  v-for="category in blogStore.categories"
                  :key="category"
                  @click="newCategory = category"
                  class="px-2 py-1 text-xs rounded-full bg-green-100 text-github-green dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  {{ category }}
                </button>
              </div>
            </div>

            <!-- 标签 -->
            <div>
              <label for="tags" class="block text-sm font-medium mb-1"
                >标签 (用逗号分隔)</label
              >
              <input
                type="text"
                id="tags"
                v-model="newTags"
                placeholder="标签1, 标签2, 标签3"
                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
              />
              <div
                class="mt-3 flex flex-wrap gap-2"
                v-if="blogStore.tags.length"
              >
                <span class="text-xs">现有标签:</span>
                <button
                  v-for="tag in blogStore.tags"
                  :key="tag"
                  @click="
                    newTags
                      ? newTags.includes(tag)
                        ? null
                        : (newTags += `, ${tag}`)
                      : (newTags = tag)
                  "
                  class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <!-- 提交按钮 -->
            <div class="flex justify-end gap-2 mt-6">
              <button
                @click="cancelUpload"
                class="px-4 py-2 border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                取消
              </button>
              <button
                @click="handleUpload"
                :disabled="!uploadedFile || uploadStatus.loading"
                :class="[
                  'px-4 py-2 rounded-md text-white',
                  !uploadedFile || uploadStatus.loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-github-blue hover:bg-blue-700',
                ]"
              >
                <span v-if="uploadStatus.loading">上传中...</span>
                <span v-else>上传博客</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 批量上传表单 -->
        <div
          v-if="showBatchUploadForm"
          class="mb-6 bg-[var(--color-bg-secondary)] p-4 rounded-md border border-[var(--color-border)]"
        >
          <h2 class="text-lg font-semibold mb-4">批量上传Markdown博客</h2>

          <div class="space-y-4">
            <!-- 文件上传 -->
            <div>
              <label
                for="markdown-files"
                class="block text-sm font-medium mb-1"
              >
                选择Markdown文件夹/文件 <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center">
                <label
                  for="markdown-files"
                  class="flex-1 cursor-pointer border border-dashed border-[var(--color-border)] rounded-md p-4 text-center hover:border-github-green transition-colors drag-drop-zone"
                  @dragover="handleDragOver"
                  @dragleave="handleDragLeave"
                  @drop="handleBatchDrop"
                >
                  <input
                    type="file"
                    id="markdown-files"
                    class="hidden"
                    accept=".md,text/markdown"
                    @change="handleMultipleFilesChange"
                    multiple
                    directory
                    webkitdirectory
                  />
                  <div
                    v-if="batchFiles.length === 0"
                    class="flex flex-col items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-10 w-10 text-github-gray mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span class="text-github-gray"
                      >点击选择文件夹或多个文件</span
                    >
                    <span class="text-xs text-github-gray mt-1"
                      >支持选择整个文件夹或多个文件</span
                    >
                  </div>
                  <div
                    v-else
                    class="flex flex-col items-center text-github-green"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-8 w-8 mb-2"
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
                    <span>已选择 {{ batchFiles.length }} 个文件</span>
                    <button
                      @click.stop="batchFiles = []"
                      class="text-xs text-red-500 mt-1 hover:underline"
                    >
                      清除选择
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <!-- 分类 -->
            <div>
              <label for="batch-category" class="block text-sm font-medium mb-1"
                >分类 (应用于所有文件)</label
              >
              <input
                type="text"
                id="batch-category"
                v-model="batchCategory"
                placeholder="分类名称"
                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
              />
              <div
                class="mt-3 flex flex-wrap gap-2"
                v-if="blogStore.categories.length"
              >
                <span class="text-xs">现有分类:</span>
                <button
                  v-for="category in blogStore.categories"
                  :key="category"
                  @click="batchCategory = category"
                  class="px-2 py-1 text-xs rounded-full bg-green-100 text-github-green dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  {{ category }}
                </button>
              </div>
            </div>

            <!-- 标签 -->
            <div>
              <label for="batch-tags" class="block text-sm font-medium mb-1"
                >标签 (用逗号分隔，应用于所有文件)</label
              >
              <input
                type="text"
                id="batch-tags"
                v-model="batchTags"
                placeholder="标签1, 标签2, 标签3"
                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
              />
              <div
                class="mt-3 flex flex-wrap gap-2"
                v-if="blogStore.tags.length"
              >
                <span class="text-xs">现有标签:</span>
                <button
                  v-for="tag in blogStore.tags"
                  :key="tag"
                  @click="
                    batchTags
                      ? batchTags.includes(tag)
                        ? null
                        : (batchTags += `, ${tag}`)
                      : (batchTags = tag)
                  "
                  class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <!-- 提交按钮 -->
            <div class="flex justify-end gap-2 mt-6">
              <button
                @click="cancelBatchUpload"
                class="px-4 py-2 border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                取消
              </button>
              <button
                @click="handleBatchUpload"
                :disabled="batchFiles.length === 0 || uploadStatus.loading"
                :class="[
                  'px-4 py-2 rounded-md text-white',
                  batchFiles.length === 0 || uploadStatus.loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-github-green hover:bg-green-700',
                ]"
              >
                <span v-if="uploadStatus.loading">处理中...</span>
                <span v-else>批量上传 ({{ batchFiles.length }}个文件)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 过滤器和搜索 -->
        <div class="mb-6 flex flex-col space-y-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索文章..."
            class="p-2 w-full border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
          />

          <div class="flex flex-wrap gap-2">
            <div>
              <select
                v-model="categoryFilter"
                class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
              >
                <option value="">所有分类</option>
                <option
                  v-for="category in blogStore.categories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
            </div>

            <div>
              <select
                v-model="tagFilter"
                class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
              >
                <option value="">所有标签</option>
                <option v-for="tag in blogStore.tags" :key="tag" :value="tag">
                  {{ tag }}
                </option>
              </select>
            </div>

            <button
              v-if="categoryFilter || tagFilter || searchQuery"
              @click="
                categoryFilter = '';
                tagFilter = '';
                searchQuery = '';
              "
              class="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              清除过滤
            </button>
          </div>
        </div>

        <!-- 文章列表 -->
        <div v-if="filteredPosts.length" class="space-y-4">
          <BlogCard v-for="post in filteredPosts" :key="post.id" :post="post" />
        </div>
        <div v-else class="text-center py-10 text-github-gray">
          没有找到符合条件的文章
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag-drop-zone.drag-over {
  border-color: var(--color-primary) !important;
  background-color: rgba(56, 139, 253, 0.1);
}
</style>
