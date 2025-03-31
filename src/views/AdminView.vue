<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useBlogStore } from "@/stores/blog";

// 获取博客Store
const blogStore = useBlogStore();

// API 基础URL
const API_URL = "http://localhost:3000/api";

// 状态变量
const isLoading = ref(false);
const error = ref(null);
const activeTab = ref("dashboard");
const posts = ref([]);
const categories = ref([]);
const tags = ref([]);
const stats = ref(null);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// 上传相关状态
const uploadFile = ref(null);
const uploadCategory = ref("");
const uploadTags = ref("");
const uploadStatus = ref("published");
const uploadProgress = ref(null);
const uploadMessage = ref("");

// 批量上传相关状态
const batchFiles = ref([]);
const batchCategory = ref("");
const batchTags = ref("");
const batchStatus = ref("published");
const batchProgress = ref(null);

// 过滤和搜索
const searchQuery = ref("");
const statusFilter = ref("");
const categoryFilter = ref("");

// 加载统计信息
const loadStats = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const response = await axios.get(`${API_URL}/admin/stats`);
    stats.value = response.data.data;
  } catch (err) {
    error.value = err.response?.data?.message || "加载统计信息失败";
    console.error("加载统计信息失败:", err);
  } finally {
    isLoading.value = false;
  }
};

// 加载博客文章
const loadPosts = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // 构建查询参数
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    if (statusFilter.value) {
      params.status = statusFilter.value;
    }

    if (categoryFilter.value) {
      params.category = categoryFilter.value;
    }

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    const response = await axios.get(`${API_URL}/admin/posts`, { params });

    posts.value = response.data.data.docs;
    pagination.value = {
      page: response.data.data.page,
      limit: response.data.data.limit,
      total: response.data.data.totalDocs,
      totalPages: response.data.data.totalPages,
    };
  } catch (err) {
    error.value = err.response?.data?.message || "加载博客文章失败";
    console.error("加载博客文章失败:", err);
  } finally {
    isLoading.value = false;
  }
};

// 加载分类
const loadCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    categories.value = response.data.data;
  } catch (err) {
    console.error("加载分类失败:", err);
  }
};

// 加载标签
const loadTags = async () => {
  try {
    const response = await axios.get(`${API_URL}/tags`);
    tags.value = response.data.data;
  } catch (err) {
    console.error("加载标签失败:", err);
  }
};

// 处理文件选择
const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    uploadFile.value = files[0];
  }
};

// 处理多文件选择
const handleBatchSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    batchFiles.value = Array.from(files);
  }
};

// 上传单个文件
const handleUpload = async () => {
  if (!uploadFile.value) {
    uploadMessage.value = "请选择要上传的文件";
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    uploadProgress.value = { status: "uploading", message: "上传中..." };

    const formData = new FormData();
    formData.append("file", uploadFile.value);
    formData.append("category", uploadCategory.value);
    formData.append("tags", uploadTags.value);
    formData.append("status", uploadStatus.value);

    const response = await axios.post(
      `${API_URL}/admin/upload-post`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    uploadProgress.value = { status: "success", message: "上传成功!" };
    uploadFile.value = null;

    // 直接更新本地状态
    posts.value.unshift(response.data.data);

    // 更新统计信息和重新加载数据
    await Promise.all([
      loadStats(),
      loadPosts(),
      blogStore.refreshData(), // 强制刷新前端博客数据
    ]);

    // 显式标记更新通知其他页面
    blogStore.markUpdate();

    // 清除表单
    uploadCategory.value = "";
    uploadTags.value = "";
  } catch (err) {
    uploadProgress.value = {
      status: "error",
      message: err.response?.data?.message || "上传失败",
    };
    error.value = err.response?.data?.message || "上传失败";
    console.error("上传失败:", err);
  } finally {
    isLoading.value = false;
    // 5秒后清除消息
    setTimeout(() => {
      uploadProgress.value = null;
    }, 5000);
  }
};

// 批量上传文件
const handleBatchUpload = async () => {
  if (batchFiles.value.length === 0) {
    uploadMessage.value = "请选择要上传的文件";
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    batchProgress.value = { status: "uploading", message: "批量上传中..." };

    const formData = new FormData();
    batchFiles.value.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("category", batchCategory.value);
    formData.append("tags", batchTags.value);
    formData.append("status", batchStatus.value);

    const response = await axios.post(
      `${API_URL}/admin/upload-posts-batch`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    batchProgress.value = {
      status: "success",
      message: `上传成功! 成功: ${response.data.data.successful}, 失败: ${response.data.data.failed}`,
    };

    // 清除表单数据
    batchFiles.value = [];
    batchCategory.value = "";
    batchTags.value = "";

    // 并行更新统计信息和文章列表，提高响应速度
    await Promise.all([
      loadStats(),
      loadPosts(),
      blogStore.refreshData(), // 刷新前端博客数据
    ]);

    // 显式标记更新通知其他页面
    blogStore.markUpdate();
  } catch (err) {
    batchProgress.value = {
      status: "error",
      message: err.response?.data?.message || "批量上传失败",
    };
    error.value = err.response?.data?.message || "批量上传失败";
    console.error("批量上传失败:", err);
  } finally {
    isLoading.value = false;
    // 5秒后清除消息
    setTimeout(() => {
      batchProgress.value = null;
    }, 5000);
  }
};

// 更改文章状态（发布/下架）
const changePostStatus = async (postId, newStatus) => {
  try {
    isLoading.value = true;
    error.value = null;

    await axios.put(`${API_URL}/admin/posts/${postId}/status`, {
      status: newStatus,
    });

    // 立即更新本地状态，提高响应速度
    const postIndex = posts.value.findIndex((post) => post._id === postId);
    if (postIndex !== -1) {
      posts.value[postIndex].status = newStatus;
    }

    // 后台刷新统计数据，不影响用户操作
    setTimeout(() => {
      loadStats();
      blogStore.refreshData(); // 强制刷新前端博客数据
      blogStore.markUpdate(); // 显式标记更新
    }, 100);
  } catch (err) {
    error.value = err.response?.data?.message || "更新文章状态失败";
    console.error("更新文章状态失败:", err);
    // 如果失败，重新加载保证数据一致性
    loadPosts();
  } finally {
    isLoading.value = false;
  }
};

// 删除文章
const deletePost = async (postId) => {
  if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    await axios.delete(`${API_URL}/admin/posts/${postId}`);

    // 立即从本地状态中移除该文章
    posts.value = posts.value.filter((post) => post._id !== postId);

    // 并行更新统计信息和文章列表，确保数据一致性
    await Promise.all([
      loadStats(),
      loadPosts(),
      blogStore.refreshData(), // 刷新前端博客数据
    ]);

    // 显式标记更新通知其他页面
    blogStore.markUpdate();
  } catch (err) {
    error.value = err.response?.data?.message || "删除文章失败";
    console.error("删除文章失败:", err);
  } finally {
    isLoading.value = false;
  }
};

// 分页处理
const handlePageChange = (newPage) => {
  pagination.value.page = newPage;
  loadPosts();
};

// 过滤器变更时重新加载
const applyFilters = () => {
  pagination.value.page = 1; // 重置到第一页
  loadPosts();
};

// 初始加载数据
onMounted(() => {
  loadStats();
  loadPosts();
  loadCategories();
  loadTags();
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">博客管理后台</h1>

        <!-- 提示消息 -->
        <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {{ error }}
        </div>

        <!-- 标签页导航 -->
        <div class="border-b border-gray-200 mb-6">
          <ul class="flex flex-wrap -mb-px">
            <li class="mr-2">
              <button
                @click="activeTab = 'dashboard'"
                class="inline-block py-2 px-4 font-medium"
                :class="
                  activeTab === 'dashboard'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                仪表盘
              </button>
            </li>
            <li class="mr-2">
              <button
                @click="activeTab = 'posts'"
                class="inline-block py-2 px-4 font-medium"
                :class="
                  activeTab === 'posts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                文章管理
              </button>
            </li>
            <li class="mr-2">
              <button
                @click="activeTab = 'upload'"
                class="inline-block py-2 px-4 font-medium"
                :class="
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                上传文章
              </button>
            </li>
            <li>
              <button
                @click="activeTab = 'batch'"
                class="inline-block py-2 px-4 font-medium"
                :class="
                  activeTab === 'batch'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                批量上传
              </button>
            </li>
          </ul>
        </div>

        <!-- 仪表盘 -->
        <div v-if="activeTab === 'dashboard'" class="space-y-6">
          <div v-if="isLoading" class="text-center py-6">加载中...</div>

          <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow-sm">
              <h2 class="text-lg font-semibold mb-2">文章数量</h2>
              <p class="text-3xl font-bold">{{ stats.counts.posts }}</p>
            </div>

            <div class="bg-green-50 dark:bg-green-900 p-6 rounded-lg shadow-sm">
              <h2 class="text-lg font-semibold mb-2">分类数量</h2>
              <p class="text-3xl font-bold">{{ stats.counts.categories }}</p>
            </div>

            <div
              class="bg-purple-50 dark:bg-purple-900 p-6 rounded-lg shadow-sm"
            >
              <h2 class="text-lg font-semibold mb-2">标签数量</h2>
              <p class="text-3xl font-bold">{{ stats.counts.tags }}</p>
            </div>
          </div>

          <!-- 最近的文章 -->
          <div v-if="stats && stats.recentPosts.length > 0" class="mt-6">
            <h3 class="text-xl font-semibold mb-3">最近文章</h3>
            <div class="overflow-x-auto">
              <table
                class="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                <thead class="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th class="py-3 px-4 text-left">标题</th>
                    <th class="py-3 px-4 text-left">状态</th>
                    <th class="py-3 px-4 text-left">发布日期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="post in stats.recentPosts"
                    :key="post._id"
                    class="border-b dark:border-gray-700"
                  >
                    <td class="py-3 px-4">{{ post.title }}</td>
                    <td class="py-3 px-4">
                      <span
                        class="px-2 py-1 text-xs rounded-full"
                        :class="
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        "
                      >
                        {{ post.status === "published" ? "已发布" : "草稿" }}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      {{ new Date(post.createdAt).toLocaleDateString() }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 文章管理 -->
        <div v-if="activeTab === 'posts'">
          <!-- 过滤和搜索 -->
          <div class="mb-6 flex flex-wrap items-center gap-4">
            <div class="flex-1 min-w-[200px]">
              <input
                v-model="searchQuery"
                @keyup.enter="applyFilters"
                type="text"
                placeholder="搜索文章..."
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                v-model="statusFilter"
                @change="applyFilters"
                class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
            </div>

            <div>
              <select
                v-model="categoryFilter"
                @change="applyFilters"
                class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有分类</option>
                <option
                  v-for="category in categories"
                  :key="category._id"
                  :value="category.name"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>

            <button
              @click="applyFilters"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              应用过滤
            </button>
          </div>

          <!-- 文章列表 -->
          <div v-if="isLoading" class="text-center py-6">加载中...</div>

          <div v-else class="overflow-x-auto">
            <table
              class="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            >
              <thead class="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th class="py-3 px-4 text-left">标题</th>
                  <th class="py-3 px-4 text-left">分类</th>
                  <th class="py-3 px-4 text-left">状态</th>
                  <th class="py-3 px-4 text-left">发布日期</th>
                  <th class="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="post in posts"
                  :key="post._id"
                  class="border-b dark:border-gray-700"
                >
                  <td class="py-3 px-4">{{ post.title }}</td>
                  <td class="py-3 px-4">
                    {{ post.category?.name || "未分类" }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="px-2 py-1 text-xs rounded-full"
                      :class="
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      "
                    >
                      {{ post.status === "published" ? "已发布" : "草稿" }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    {{ new Date(post.createdAt).toLocaleDateString() }}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button
                      v-if="post.status === 'published'"
                      @click="changePostStatus(post._id, 'draft')"
                      class="text-yellow-600 hover:text-yellow-800 mr-3"
                    >
                      下架
                    </button>
                    <button
                      v-else
                      @click="changePostStatus(post._id, 'published')"
                      class="text-green-600 hover:text-green-800 mr-3"
                    >
                      发布
                    </button>
                    <button
                      @click="deletePost(post._id)"
                      class="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div
            v-if="pagination.totalPages > 1"
            class="mt-6 flex justify-center"
          >
            <div class="flex space-x-1">
              <button
                v-for="page in pagination.totalPages"
                :key="page"
                @click="handlePageChange(page)"
                class="px-3 py-1 rounded"
                :class="
                  pagination.page === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                "
              >
                {{ page }}
              </button>
            </div>
          </div>
        </div>

        <!-- 上传单个文章 -->
        <div v-if="activeTab === 'upload'" class="max-w-2xl mx-auto">
          <h2 class="text-xl font-semibold mb-4">上传文章</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1"
                >Markdown 文件</label
              >
              <input
                type="file"
                @change="handleFileSelect"
                accept=".md,text/markdown"
                class="w-full px-3 py-2 border rounded-lg"
              />
              <p class="mt-1 text-sm text-gray-500">
                支持 .md 格式的 Markdown 文件
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">分类</label>
              <input
                v-model="uploadCategory"
                type="text"
                placeholder="输入分类名称"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">标签</label>
              <input
                v-model="uploadTags"
                type="text"
                placeholder="输入标签，用逗号分隔"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">状态</label>
              <select
                v-model="uploadStatus"
                class="w-full px-3 py-2 border rounded-lg"
              >
                <option value="published">发布</option>
                <option value="draft">保存为草稿</option>
              </select>
            </div>

            <div>
              <button
                @click="handleUpload"
                :disabled="isLoading || !uploadFile"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                上传文章
              </button>
            </div>

            <!-- 上传状态 -->
            <div v-if="uploadProgress" class="mt-4">
              <div
                class="p-3 rounded-lg"
                :class="{
                  'bg-blue-100 text-blue-700':
                    uploadProgress.status === 'uploading',
                  'bg-green-100 text-green-700':
                    uploadProgress.status === 'success',
                  'bg-red-100 text-red-700': uploadProgress.status === 'error',
                }"
              >
                {{ uploadProgress.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- 批量上传 -->
        <div v-if="activeTab === 'batch'" class="max-w-2xl mx-auto">
          <h2 class="text-xl font-semibold mb-4">批量上传文章</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1"
                >Markdown 文件</label
              >
              <input
                type="file"
                @change="handleBatchSelect"
                accept=".md,text/markdown"
                multiple
                class="w-full px-3 py-2 border rounded-lg"
              />
              <p class="mt-1 text-sm text-gray-500">
                可以选择多个 .md 格式的 Markdown 文件
              </p>

              <!-- 已选文件列表 -->
              <div v-if="batchFiles.length > 0" class="mt-2">
                <p class="text-sm font-medium">
                  已选择 {{ batchFiles.length }} 个文件:
                </p>
                <ul class="text-sm text-gray-600 mt-1 max-h-32 overflow-y-auto">
                  <li
                    v-for="(file, index) in batchFiles"
                    :key="index"
                    class="truncate"
                  >
                    {{ file.name }}
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">公共分类</label>
              <input
                v-model="batchCategory"
                type="text"
                placeholder="输入分类名称"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">公共标签</label>
              <input
                v-model="batchTags"
                type="text"
                placeholder="输入标签，用逗号分隔"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">状态</label>
              <select
                v-model="batchStatus"
                class="w-full px-3 py-2 border rounded-lg"
              >
                <option value="published">发布</option>
                <option value="draft">保存为草稿</option>
              </select>
            </div>

            <div>
              <button
                @click="handleBatchUpload"
                :disabled="isLoading || batchFiles.length === 0"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                批量上传
              </button>
            </div>

            <!-- 上传状态 -->
            <div v-if="batchProgress" class="mt-4">
              <div
                class="p-3 rounded-lg"
                :class="{
                  'bg-blue-100 text-blue-700':
                    batchProgress.status === 'uploading',
                  'bg-green-100 text-green-700':
                    batchProgress.status === 'success',
                  'bg-red-100 text-red-700': batchProgress.status === 'error',
                }"
              >
                {{ batchProgress.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
