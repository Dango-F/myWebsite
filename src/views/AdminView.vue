<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useBlogStore } from "@/stores/blog";
import { useThemeStore } from "@/stores/theme";
import { formatDateTime } from "@/utils/markdown";

// 获取博客Store
const blogStore = useBlogStore();
// 获取主题Store
const themeStore = useThemeStore();

// 计算当前是否为暗色主题
const isDarkMode = computed(() => themeStore.theme === "dark");

// API 基础URL
const API_URL = "http://localhost:3000/api";

// 状态变量
const isLoading = ref(false);
const error = ref(null);
const activeTab = ref("dashboard");
const activeSection = ref("dashboard");
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

// 批量选择和删除相关状态
const selectedPostIds = ref([]);
const selectAll = ref(false);

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

// 文件输入引用
const fileInputRef = ref(null);
const batchFileInputRef = ref(null);

// 系统相关状态
const syncStatus = ref(null);

// 分类同步状态
const categorySync = ref(null);

// 标签同步状态
const tagSync = ref(null);

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

        // 添加调试日志，确认date字段存在
        console.log(
            "加载的文章数据:",
            posts.value.map((p) => ({
                title: p.title,
                status: p.status,
                date: p.date,
                createdAt: p.createdAt,
            }))
        );

        pagination.value = {
            page: response.data.data.page,
            limit: response.data.data.limit,
            total: response.data.data.totalDocs,
            totalPages: response.data.data.totalPages,
        };

        // 加载文章后自动更新分类和标签
        await Promise.all([
            loadCategories(),
            loadTags()
        ]);
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

        // 清空表单
        uploadFile.value = null;
        uploadCategory.value = "";
        uploadTags.value = "";

        // 重置文件输入框
        if (fileInputRef.value) {
            fileInputRef.value.value = "";
        }

        // 直接更新本地状态
        posts.value.unshift(response.data.data);

        // 更新统计信息和重新加载数据
        await Promise.all([
            loadStats(),
            loadPosts(),
            blogStore.refreshData(), // 强制刷新前端博客数据
            // 自动同步分类和标签
            syncCategories(),
            syncTags()
        ]);

        // 显式标记更新通知其他页面
        blogStore.markUpdate();
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

        // 重置文件输入框
        if (batchFileInputRef.value) {
            batchFileInputRef.value.value = "";
        }

        // 并行更新统计信息和文章列表，提高响应速度
        await Promise.all([
            loadStats(),
            loadPosts(),
            blogStore.refreshData(), // 刷新前端博客数据
            // 自动同步分类和标签
            syncCategories(),
            syncTags()
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

        // 获取更改前的文章状态，用于调试
        const postBefore = posts.value.find((post) => post._id === postId);
        if (postBefore) {
            console.log(`更改状态前的文章数据:`, {
                id: postId,
                title: postBefore.title,
                status: postBefore.status,
                date: postBefore.date,
                createdAt: postBefore.createdAt,
            });
        }

        await axios.put(`${API_URL}/admin/posts/${postId}/status`, {
            status: newStatus,
        });

        // 立即重新加载文章列表，获取最新的date字段值
        await loadPosts();

        // 获取更改后的文章状态，用于调试
        const postAfter = posts.value.find((post) => post._id === postId);
        if (postAfter) {
            console.log(`更改状态后的文章数据:`, {
                id: postId,
                title: postAfter.title,
                status: postAfter.status,
                date: postAfter.date,
                createdAt: postAfter.createdAt,
            });
        }

        // 后台刷新统计数据和前端博客数据，不影响用户操作
        setTimeout(() => {
            loadStats();
            blogStore.refreshData(); // 强制刷新前端博客数据
            blogStore.markUpdate(); // 显式标记更新
            // 自动同步分类和标签
            syncCategories();
            syncTags();
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
            // 自动同步分类和标签
            syncCategories(),
            syncTags()
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

// 替换原来的刷新函数
const handleRefresh = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // 执行全部数据刷新任务
        const refreshTasks = [
            loadStats(), // 刷新统计信息
            loadPosts(), // 刷新博客列表
            loadCategories(), // 刷新分类
            loadTags(), // 刷新标签
            blogStore.refreshData(), // 刷新前端博客数据
        ];

        // 并行执行所有刷新任务
        await Promise.all(refreshTasks);

        // 显示成功消息
        const successMessage = {
            status: "success",
            message: "数据刷新成功！",
        };

        // 根据当前标签设置相应的状态消息
        if (activeTab.value === "upload") {
            uploadProgress.value = successMessage;
            setTimeout(() => {
                uploadProgress.value = null;
            }, 3000);
        } else if (activeTab.value === "batch") {
            batchProgress.value = successMessage;
            setTimeout(() => {
                batchProgress.value = null;
            }, 3000);
        } else {
            // 对于其他页面，添加一个临时的成功提示
            error.value = "数据刷新成功！";
            setTimeout(() => {
                error.value = null;
            }, 3000);
        }
    } catch (err) {
        error.value = "刷新数据失败，请稍后重试";
        console.error("刷新数据失败:", err);
    } finally {
        isLoading.value = false;
    }
};

// 修改导航切换逻辑，确保加载相应数据
const switchTab = async (section, tab) => {
    activeSection.value = section;
    activeTab.value = tab;

    // 根据激活的标签页加载相应数据
    if (tab === "dashboard") {
        await loadStats();
    } else if (tab === "posts") {
        await loadPosts();
    } else if (tab === "categories") {
        await loadCategories();
    } else if (tab === "tags") {
        await loadTags();
    }
};

// 同步文件系统和数据库
const syncFilesWithDatabase = async () => {
    if (
        !confirm(
            "确定要同步文件系统和数据库吗？这将删除没有对应Markdown文件的博客记录。"
        )
    ) {
        return;
    }

    try {
        isLoading.value = true;
        syncStatus.value = {
            status: "syncing",
            message: "正在同步文件系统和数据库...",
        };

        const response = await axios.post(`${API_URL}/admin/sync-files`);

        syncStatus.value = {
            status: "success",
            message: response.data.data.message,
            details: response.data.data.result,
        };

        // 更新统计信息和文章列表
        await Promise.all([
            loadStats(),
            loadPosts(),
            blogStore.refreshData(), // 刷新前端博客数据
        ]);

        // 显式标记更新通知其他页面
        blogStore.markUpdate();
    } catch (err) {
        syncStatus.value = {
            status: "error",
            message: err.response?.data?.message || "同步失败",
        };
        console.error("同步文件系统和数据库失败:", err);
    } finally {
        isLoading.value = false;
    }
};

// 同步分类
const syncCategories = async () => {
    try {
        isLoading.value = true;
        categorySync.value = { status: "syncing", message: "正在同步分类..." };

        // 调用同步接口
        const response = await axios.post(`${API_URL}/admin/sync-categories`);

        // 更新同步状态
        categorySync.value = {
            status: "success",
            message: response.data.data.message,
            results: response.data.data.results,
        };

        // 刷新分类列表
        await loadCategories();
    } catch (err) {
        categorySync.value = {
            status: "error",
            message: err.response?.data?.message || "分类同步失败",
        };
        console.error("分类同步失败:", err);
    } finally {
        isLoading.value = false;
    }
};

// 同步标签
const syncTags = async () => {
    try {
        isLoading.value = true;
        tagSync.value = { status: "syncing", message: "正在同步标签..." };

        // 调用同步接口
        const response = await axios.post(`${API_URL}/admin/sync-tags`);

        // 更新同步状态
        tagSync.value = {
            status: "success",
            message: response.data.data.message,
            results: response.data.data.results,
        };

        // 刷新标签列表
        await loadTags();
    } catch (err) {
        tagSync.value = {
            status: "error",
            message: err.response?.data?.message || "标签同步失败",
        };
        console.error("标签同步失败:", err);
    } finally {
        isLoading.value = false;
    }
};

// 批量删除文章
const batchDeletePosts = async () => {
    if (selectedPostIds.value.length === 0) {
        error.value = "请先选择要删除的文章";
        setTimeout(() => {
            error.value = null;
        }, 3000);
        return;
    }

    if (!confirm(`确定要删除已选中的 ${selectedPostIds.value.length} 篇文章吗？此操作不可撤销。`)) {
        return;
    }

    try {
        isLoading.value = true;
        error.value = null;

        const response = await axios.delete(`${API_URL}/admin/posts`, {
            data: { ids: selectedPostIds.value }
        });

        // 显示成功消息
        const result = response.data.data;
        error.value = `成功删除 ${result.deleted} 篇文章，清理了 ${result.filesDeleted} 个相关文件`;

        // 清空选择
        selectedPostIds.value = [];
        selectAll.value = false;

        // 重新加载数据
        await Promise.all([
            loadStats(),
            loadPosts(),
            blogStore.refreshData(),
            // 自动同步分类和标签
            syncCategories(),
            syncTags()
        ]);

        // 显式标记更新通知其他页面
        blogStore.markUpdate();

        // 几秒后清除消息
        setTimeout(() => {
            error.value = null;
        }, 5000);
    } catch (err) {
        error.value = err.response?.data?.message || "批量删除文章失败";
        console.error("批量删除文章失败:", err);
    } finally {
        isLoading.value = false;
    }
};

// 切换全选状态
const toggleSelectAll = () => {
    if (selectAll.value) {
        // 选择所有文章
        selectedPostIds.value = posts.value.map(post => post._id);
    } else {
        // 取消所有选择
        selectedPostIds.value = [];
    }
};

// 检查选择状态变化
watch(selectedPostIds, () => {
    // 如果所有文章都被选中，将全选状态设为true
    if (posts.value.length > 0 && selectedPostIds.value.length === posts.value.length) {
        selectAll.value = true;
    } else {
        selectAll.value = false;
    }
});

// 初始加载数据
onMounted(() => {
    loadStats();
    loadPosts();
    loadCategories();
    loadTags();
});
</script>

<template>
    <div class="container mx-auto px-4 py-6" :class="{ dark: isDarkMode }">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold">网站管理后台</h1>
                    <button @click="handleRefresh" :disabled="isLoading"
                        class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': isLoading }"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{{ "刷新" }}</span>
                    </button>
                </div>

                <!-- 提示消息 -->
                <div v-if="error" :class="[
                    'mb-4 p-3 rounded',
                    error === '数据刷新成功！'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
                ]">
                    {{ error }}
                </div>

                <!-- 主导航 -->
                <div class="flex mb-6 border-b border-gray-200">
                    <button @click="switchTab('dashboard', 'dashboard')" class="px-4 py-2 font-medium relative" :class="activeSection === 'dashboard'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        ">
                        <div class="flex items-center">
                            <svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            仪表盘
                        </div>
                    </button>

                    <button @click="switchTab('blog', 'posts')" class="px-4 py-2 font-medium relative" :class="activeSection === 'blog'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        ">
                        <div class="flex items-center">
                            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                                <path
                                    d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm11.75 4.5a.75.75 0 0 0 0-1.5h-8.5a.75.75 0 0 0 0 1.5ZM6 8a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5Zm-3 4.75a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Z">
                                </path>
                            </svg>
                            博客管理
                        </div>
                    </button>

                    <button @click="switchTab('system', 'settings')" class="px-4 py-2 font-medium relative" :class="activeSection === 'system'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        ">
                        <div class="flex items-center">
                            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                                <path
                                    d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.47.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.624a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456-.049.767-.435 1.266-.535 1.362-.1.097-.587.443-1.355.494-.493.032-1.044-.118-1.45-.53l.816-.806c.08-.08.159-.73.13-.18-.21-.345.403-.677.572-.989.02-.029.086-.075.195-.045l1.102.302c.56.153 1.113.008 1.53-.27.161-.107.328-.204.501-.29.447-.222.85-.629.997-1.189l.289-1.105c.029-.11.101-.143.137-.146.018-.002.035-.002.053-.002.219 0 .635.002.962.003.327.001.743.002.962.001.018 0 .035 0 .053.002.035.003.108.036.137.146l.289 1.105c.147.561.549.967.998 1.189.173.086.34.183.5.29.417.278.97.423 1.529.27l1.103-.303c.109-.03.175.016.195.045.22.312.412.644.573.99.014.031.021.11-.059.19l-.815.806c-.411.406-.562.957-.53 1.456.049.767.435 1.266.535 1.362.1.097.587.443 1.355.494.493.032 1.044-.118 1.45-.53l.816-.806c.08-.08.159-.73.13-.18-.21-.345-.677-.572-.989-.02-.029-.086-.075-.195-.045l-1.102.302c-.56.153-1.113.008-1.53-.27-.161-.107-.328-.204-.501-.29-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146-.018-.002-.035-.002-.053-.002-.219 0-.635.002-.962.003-.327.001-.743.002-.962.001-.018 0-.035 0 -.053-.002Z">
                                </path>
                            </svg>
                            系统设置
                        </div>
                    </button>
                </div>

                <!-- 子导航（只在博客管理部分显示） -->
                <div v-if="activeSection === 'blog'" class="border-b border-gray-200 mb-6">
                    <ul class="flex flex-wrap -mb-px">
                        <li class="mr-2">
                            <button @click="switchTab('blog', 'posts')" class="inline-block py-2 px-4 font-medium"
                                :class="activeTab === 'posts'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    ">
                                文章管理
                            </button>
                        </li>
                        <li class="mr-2">
                            <button @click="switchTab('blog', 'upload')" class="inline-block py-2 px-4 font-medium"
                                :class="activeTab === 'upload'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    ">
                                上传文章
                            </button>
                        </li>
                        <li>
                            <button @click="switchTab('blog', 'batch')" class="inline-block py-2 px-4 font-medium"
                                :class="activeTab === 'batch'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    ">
                                批量上传
                            </button>
                        </li>
                        <li>
                            <button @click="switchTab('blog', 'categories')" class="inline-block py-2 px-4 font-medium"
                                :class="activeTab === 'categories'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    ">
                                分类管理
                            </button>
                        </li>
                        <li>
                            <button @click="switchTab('blog', 'tags')" class="inline-block py-2 px-4 font-medium"
                                :class="activeTab === 'tags'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    ">
                                标签管理
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- 当前内容部分 -->

                <!-- 仪表盘 -->
                <div v-if="activeTab === 'dashboard'" class="space-y-6">
                    <div v-if="isLoading" class="text-center py-6">加载中...</div>

                    <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-blue-200 dark:bg-blue-900 p-6 rounded-lg shadow-sm">
                            <h2 class="text-lg font-semibold mb-2">文章数量</h2>
                            <p class="text-3xl font-bold">{{ stats.counts.posts }}</p>
                        </div>

                        <div class="bg-green-200 dark:bg-green-900 p-6 rounded-lg shadow-sm">
                            <h2 class="text-lg font-semibold mb-2">分类数量</h2>
                            <p class="text-3xl font-bold">{{ stats.counts.categories }}</p>
                            <div class="mt-3 max-h-36 overflow-y-auto">
                                <div class="flex flex-wrap gap-2">
                                    <span v-for="category in stats.categories.slice(0, 5)" :key="category._id"
                                        class="px-2 py-1 text-xs rounded-full bg-white dark:bg-green-800 border border-green-200 text-green-800 dark:text-green-200">
                                        {{ category.name }}
                                    </span>
                                    <span v-if="stats.categories.length > 5"
                                        class="px-2 py-1 text-xs bg-white dark:bg-green-800 border border-green-200 rounded-full text-green-800 dark:text-green-200">
                                        等共{{ stats.categories.length }}个分类
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-purple-200 dark:bg-purple-900 p-6 rounded-lg shadow-sm">
                            <h2 class="text-lg font-semibold mb-2">标签数量</h2>
                            <p class="text-3xl font-bold">{{ stats.counts.tags }}</p>
                            <div class="mt-3 max-h-36 overflow-y-auto">
                                <div class="flex flex-wrap gap-2">
                                    <span v-for="tag in stats.tags.slice(0, 5)" :key="tag._id"
                                        class="px-2 py-1 text-xs rounded-full bg-white dark:bg-purple-800 border border-purple-200 text-purple-800 dark:text-purple-200">
                                        {{ tag.name }}
                                    </span>
                                    <span v-if="stats.tags.length > 5"
                                        class="px-2 py-1 text-xs bg-white dark:bg-purple-800 border border-purple-200 rounded-full text-purple-800 dark:text-purple-200">
                                        等共{{ stats.tags.length }}个标签
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 最近的文章 -->
                    <div v-if="stats && stats.recentPosts.length > 0" class="mt-6">
                        <h3 class="text-xl font-semibold mb-3">最近文章</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                                <thead class="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th class="py-3 px-4 text-center">标题</th>
                                        <th class="py-3 px-4 text-center">分类</th>
                                        <th class="py-3 px-4 text-center">标签</th>
                                        <th class="py-3 px-4 text-center">状态</th>
                                        <th class="py-3 px-4 text-center">发布日期</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="post in stats.recentPosts" :key="post._id"
                                        class="border-b dark:border-gray-700">
                                        <td class="py-3 px-4 text-center">{{ post.title }}</td>
                                        <td class="py-3 px-4 text-center">
                                            <span
                                                class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {{ post.category?.name || "未分类" }}
                                            </span>
                                        </td>
                                        <td class="py-3 px-4 text-center">
                                            <div class="flex flex-wrap gap-1 justify-center">
                                                <span v-for="tag in post.tags" :key="tag._id"
                                                    class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                    {{ tag.name }}
                                                </span>
                                                <span v-if="!post.tags || post.tags.length === 0"
                                                    class="text-gray-400 text-xs">无标签</span>
                                            </div>
                                        </td>
                                        <td class="py-3 px-4 text-center">
                                            <span class="px-2 py-1 text-xs rounded-full" :class="post.status === 'published'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                ">
                                                {{ post.status === "published" ? "已发布" : "草稿" }}
                                            </span>
                                        </td>
                                        <td class="py-3 px-4 text-center">
                                            {{ formatDateTime(post.date || post.createdAt) }}
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
                            <input v-model="searchQuery" @keyup.enter="applyFilters" type="text" placeholder="搜索文章..."
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div>
                            <select v-model="statusFilter" @change="applyFilters"
                                class="px-4 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                <option value="">所有状态</option>
                                <option value="published">已发布</option>
                                <option value="draft">草稿</option>
                            </select>
                        </div>

                        <div>
                            <select v-model="categoryFilter" @change="applyFilters"
                                class="px-4 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                <option value="">所有分类</option>
                                <option v-for="category in categories" :key="category._id" :value="category.name">
                                    {{ category.name }}
                                </option>
                            </select>
                        </div>

                        <button @click="applyFilters"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            应用过滤
                        </button>
                    </div>

                    <!-- 批量操作按钮 -->
                    <div class="mb-4 flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                已选择 {{ selectedPostIds.length }} / {{ posts.length }} 篇文章
                            </span>
                        </div>
                        <div>
                            <button @click="batchDeletePosts" :disabled="selectedPostIds.length === 0"
                                class="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                批量删除
                            </button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                            <thead class="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th class="py-3 px-4 text-center">
                                        <input type="checkbox" v-model="selectAll" @change="toggleSelectAll"
                                            class="w-4 h-4 rounded border-gray-300" title="全选/取消全选">
                                    </th>
                                    <th class="py-3 px-4 text-center">标题</th>
                                    <th class="py-3 px-4 text-center">分类</th>
                                    <th class="py-3 px-4 text-center">标签</th>
                                    <th class="py-3 px-4 text-center">状态</th>
                                    <th class="py-3 px-4 text-center">发布日期</th>
                                    <th class="py-3 px-4 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="post in posts" :key="post._id" class="border-b dark:border-gray-700">
                                    <td class="py-3 px-4 text-center">
                                        <input type="checkbox" :value="post._id" v-model="selectedPostIds"
                                            class="w-4 h-4 rounded border-gray-300">
                                    </td>
                                    <td class="py-3 px-4 text-center">{{ post.title }}</td>
                                    <td class="py-3 px-4 text-center">
                                        <span
                                            class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{{
                                            post.category?.name || "未分类" }}</span>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <div class="flex flex-wrap gap-1 justify-center">
                                            <span v-for="tag in post.tags" :key="tag._id"
                                                class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                {{ tag.name }}
                                            </span>
                                            <span v-if="!post.tags || post.tags.length === 0"
                                                class="text-gray-400 text-xs">无标签</span>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <span class="px-2 py-1 text-xs rounded-full" :class="post.status === 'published'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            ">
                                            {{ post.status === "published" ? "已发布" : "草稿" }}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        {{ formatDateTime(post.date || post.createdAt) }}
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <button v-if="post.status === 'published'"
                                            @click="changePostStatus(post._id, 'draft')"
                                            class="text-yellow-600 hover:text-yellow-800 mr-3">
                                            下架
                                        </button>
                                        <button v-else @click="changePostStatus(post._id, 'published')"
                                            class="text-green-600 hover:text-green-800 mr-3">
                                            发布
                                        </button>
                                        <button @click="deletePost(post._id)" class="text-red-600 hover:text-red-800">
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 分页 -->
                    <div v-if="pagination.totalPages > 1" class="mt-6 flex justify-center">
                        <div class="flex space-x-1">
                            <button v-for="page in pagination.totalPages" :key="page" @click="handlePageChange(page)"
                                class="px-3 py-1 rounded" :class="pagination.page === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    ">
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
                            <label class="block text-sm font-medium mb-1">Markdown 文件</label>
                            <input type="file" ref="fileInputRef" @change="handleFileSelect" accept=".md,text/markdown"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200" />
                            <p class="mt-1 text-sm text-gray-500">
                                支持 .md 格式的 Markdown 文件
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">分类</label>
                            <input v-model="uploadCategory" type="text" placeholder="输入分类名称"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">标签</label>
                            <input v-model="uploadTags" type="text" placeholder="输入标签，用逗号分隔"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">状态</label>
                            <select v-model="uploadStatus"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                <option value="published">发布</option>
                                <option value="draft">保存为草稿</option>
                            </select>
                        </div>

                        <div>
                            <button @click="handleUpload" :disabled="isLoading || !uploadFile"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                                上传文章
                            </button>
                        </div>

                        <!-- 上传状态 -->
                        <div v-if="uploadProgress" class="mt-4">
                            <div class="p-3 rounded-lg" :class="{
                                'bg-blue-100 text-blue-700':
                                    uploadProgress.status === 'uploading',
                                'bg-green-100 text-green-700':
                                    uploadProgress.status === 'success',
                                'bg-red-100 text-red-700': uploadProgress.status === 'error',
                            }">
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
                            <label class="block text-sm font-medium mb-1">Markdown 文件</label>
                            <input type="file" ref="batchFileInputRef" @change="handleBatchSelect"
                                accept=".md,text/markdown" multiple
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200" />
                            <p class="mt-1 text-sm text-gray-500">
                                可以选择多个 .md 格式的 Markdown 文件
                            </p>

                            <!-- 已选文件列表 -->
                            <div v-if="batchFiles.length > 0" class="mt-2">
                                <p class="text-sm font-medium">
                                    已选择 {{ batchFiles.length }} 个文件:
                                </p>
                                <ul class="text-sm text-gray-600 mt-1 max-h-32 overflow-y-auto">
                                    <li v-for="(file, index) in batchFiles" :key="index" class="truncate">
                                        {{ file.name }}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">公共分类</label>
                            <input v-model="batchCategory" type="text" placeholder="输入分类名称"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">公共标签</label>
                            <input v-model="batchTags" type="text" placeholder="输入标签，用逗号分隔"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">状态</label>
                            <select v-model="batchStatus"
                                class="w-full px-3 py-2 border rounded-lg dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                <option value="published">发布</option>
                                <option value="draft">保存为草稿</option>
                            </select>
                        </div>

                        <div>
                            <button @click="handleBatchUpload" :disabled="isLoading || batchFiles.length === 0"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                                批量上传
                            </button>
                        </div>

                        <!-- 上传状态 -->
                        <div v-if="batchProgress" class="mt-4">
                            <div class="p-3 rounded-lg" :class="{
                                'bg-blue-100 text-blue-700':
                                    batchProgress.status === 'uploading',
                                'bg-green-100 text-green-700':
                                    batchProgress.status === 'success',
                                'bg-red-100 text-red-700': batchProgress.status === 'error',
                            }">
                                {{ batchProgress.message }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 分类管理 -->
                <div v-if="activeTab === 'categories'" class="max-w-2xl mx-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">分类管理</h2>
                        <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>已启用自动同步</span>
                        </div>
                    </div>

                    <!-- 同步状态 -->
                    <div v-if="categorySync" class="mb-4">
                        <div class="p-3 rounded-lg" :class="{
                            'bg-blue-100 text-blue-700': categorySync.status === 'syncing',
                            'bg-green-100 text-green-700':
                                categorySync.status === 'success',
                            'bg-red-100 text-red-700': categorySync.status === 'error',
                        }">
                            <div class="mb-2">{{ categorySync.message }}</div>

                            <!-- 成功时显示详情 -->
                            <div v-if="categorySync.status === 'success' && categorySync.results">
                                <div v-if="categorySync.results.total > 0" class="mt-2">
                                    <p class="font-medium">已删除的未使用分类:</p>
                                    <div class="max-h-36 overflow-y-auto mt-1 border rounded p-2">
                                        <div v-for="(category, index) in categorySync.results.deleted" :key="index"
                                            class="text-sm mb-1">
                                            <span class="font-medium">{{ category.name }}</span>
                                            <span class="text-xs ml-2">({{ category.slug }})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="isLoading" class="text-center py-6">加载中...</div>
                    <div v-else-if="categories.length > 0" class="space-y-4">
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h3 class="font-medium mb-2">现有分类</h3>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="category in categories" :key="category._id"
                                    class="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg border flex items-center">
                                    <span>{{ category.name }}</span>
                                    <span class="ml-2 text-gray-500 text-sm">({{ category.slug }})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-4 text-gray-500">暂无分类数据</div>
                </div>

                <!-- 标签管理 -->
                <div v-if="activeTab === 'tags'" class="max-w-2xl mx-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">标签管理</h2>
                        <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>已启用自动同步</span>
                        </div>
                    </div>

                    <!-- 同步状态 -->
                    <div v-if="tagSync" class="mb-4">
                        <div class="p-3 rounded-lg" :class="{
                            'bg-blue-100 text-blue-700': tagSync.status === 'syncing',
                            'bg-green-100 text-green-700': tagSync.status === 'success',
                            'bg-red-100 text-red-700': tagSync.status === 'error',
                        }">
                            <div class="mb-2">{{ tagSync.message }}</div>

                            <!-- 成功时显示详情 -->
                            <div v-if="tagSync.status === 'success' && tagSync.results">
                                <div v-if="tagSync.results.total > 0" class="mt-2">
                                    <p class="font-medium">已删除的未使用标签:</p>
                                    <div class="max-h-36 overflow-y-auto mt-1 border rounded p-2">
                                        <div v-for="(tag, index) in tagSync.results.deleted" :key="index"
                                            class="text-sm mb-1">
                                            <span class="font-medium">{{ tag.name }}</span>
                                            <span class="text-xs ml-2">({{ tag.slug }})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="isLoading" class="text-center py-6">加载中...</div>
                    <div v-else-if="tags.length > 0" class="space-y-4">
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h3 class="font-medium mb-2">现有标签</h3>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="tag in tags" :key="tag._id"
                                    class="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg border flex items-center">
                                    <span>{{ tag.name }}</span>
                                    <span class="ml-2 text-gray-500 text-sm">({{ tag.slug }})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-4 text-gray-500">暂无标签数据</div>
                </div>

                <!-- 系统设置 -->
                <div v-if="activeTab === 'settings'" class="max-w-2xl mx-auto">
                    <h2 class="text-xl font-semibold mb-6">系统设置</h2>

                    <div class="space-y-8">
                        <!-- 基本设置部分 -->
                        <div class="space-y-4">
                            <h3 class="font-medium text-lg border-b pb-2">基本设置</h3>

                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    这里是网站的基本设置，包括网站标题、描述等信息。这些设置会影响网站的显示和SEO。
                                </p>

                                <p class="text-center text-gray-500 italic">
                                    此功能正在开发中...
                                </p>
                            </div>
                        </div>

                        <!-- 数据同步部分 -->
                        <div class="space-y-4">
                            <h3 class="font-medium text-lg border-b pb-2">数据同步</h3>

                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    同步文件系统和数据库可以确保所有数据的一致性。当你手动删除或添加文件时，可以使用此功能更新数据库。
                                </p>

                                <div class="flex flex-wrap gap-3">
                                    <button @click="syncFilesWithDatabase" :disabled="isLoading"
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                                        {{ isLoading ? "同步中..." : "同步文件系统和数据库" }}
                                    </button>
                                </div>

                                <!-- 同步状态 -->
                                <div v-if="syncStatus" class="mt-4">
                                    <div class="p-3 rounded-lg" :class="{
                                        'bg-blue-100 text-blue-700':
                                            syncStatus.status === 'syncing',
                                        'bg-green-100 text-green-700':
                                            syncStatus.status === 'success',
                                        'bg-red-100 text-red-700': syncStatus.status === 'error',
                                    }">
                                        <div class="mb-2">{{ syncStatus.message }}</div>

                                        <!-- 成功时显示详情 -->
                                        <div v-if="
                                            syncStatus.status === 'success' && syncStatus.details
                                        ">
                                            <p class="font-medium mt-2">同步详情:</p>
                                            <ul class="list-disc pl-5 mt-1 text-sm">
                                                <li>检查文章数: {{ syncStatus.details.checked }}</li>
                                                <li>
                                                    删除文章数: {{ syncStatus.details.removed.length }}
                                                </li>
                                                <li v-if="syncStatus.details.errors.length > 0">
                                                    错误数: {{ syncStatus.details.errors.length }}
                                                </li>
                                            </ul>

                                            <!-- 显示被删除的文章列表 -->
                                            <div v-if="syncStatus.details.removed.length > 0" class="mt-2">
                                                <p class="font-medium">已删除文章:</p>
                                                <div class="max-h-40 overflow-y-auto mt-1 border rounded p-2">
                                                    <div v-for="(post, index) in syncStatus.details.removed"
                                                        :key="index" class="text-sm mb-1">
                                                        <span class="font-medium">{{ post.title }}</span>
                                                        <span class="text-xs ml-2">分类: {{ post.category }}</span>
                                                        <span v-if="post.tags && post.tags.length > 0"
                                                            class="text-xs ml-2">
                                                            标签: {{ post.tags.join(", ") }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 数据备份部分 -->
                        <div class="space-y-4">
                            <h3 class="font-medium text-lg border-b pb-2">数据备份</h3>

                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    定期备份数据可以防止数据丢失。你可以在这里手动备份数据或设置自动备份计划。
                                </p>

                                <div class="flex flex-wrap gap-3">
                                    <button
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        导出博客数据
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 缓存管理部分 -->
                        <div class="space-y-4">
                            <h3 class="font-medium text-lg border-b pb-2">缓存管理</h3>

                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    清理缓存可以释放浏览器空间并获取最新数据。这对于解决显示问题很有帮助。
                                </p>

                                <div class="flex flex-wrap gap-3">
                                    <button @click="blogStore.refreshData()"
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        清理博客缓存
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
