import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

// 使用SharedWorker或localStorage实现后台更新通知
const LAST_UPDATE_KEY = "blog_last_update_time";

export const useBlogStore = defineStore("blog", () => {
  const posts = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const lastRefreshTime = ref(Date.now());

  // 监听其他标签页的更新通知
  const setupUpdateListener = () => {
    // 使用storage事件监听，而不是定时器
    window.addEventListener("storage", (event) => {
      if (event.key === LAST_UPDATE_KEY) {
        const newUpdateTime = parseInt(event.newValue);
        if (newUpdateTime > lastRefreshTime.value) {
          console.log("检测到其他页面更新了博客数据，自动刷新中...");
          fetchPosts(true); // 直接强制刷新
        }
      }
    });
  };

  // 初始化更新监听器
  setupUpdateListener();

  // 标记后台更新，通知其他标签页
  const markUpdate = () => {
    const now = Date.now();
    // 先保存当前值
    const oldValue = localStorage.getItem(LAST_UPDATE_KEY);
    // 设置新值
    localStorage.setItem(LAST_UPDATE_KEY, now.toString());
    lastRefreshTime.value = now;

    // 手动触发当前页面的刷新 - localStorage事件只在其他页面触发
    console.log("已通知其他标签页数据已更新");
  };

  // 从本地存储加载博客文章（用作离线缓存）
  const loadLocalPosts = () => {
    try {
      const storedPosts = localStorage.getItem("blog_posts");
      const storedTime = localStorage.getItem("blog_posts_time");

      // 如果存储时间超过30分钟，不使用缓存
      if (storedPosts && storedTime) {
        const cacheAge = Date.now() - parseInt(storedTime);
        if (cacheAge < 30 * 60 * 1000) {
          // 30分钟缓存有效期
          return JSON.parse(storedPosts);
        }
      }
    } catch (err) {
      console.error("从本地存储加载博客失败:", err);
    }
    return [];
  };

  // 保存到本地存储
  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem("blog_posts", JSON.stringify(data));
      localStorage.setItem("blog_posts_time", Date.now().toString());
      // 同时更新最后更新时间，通知其他标签页
      markUpdate();
    } catch (err) {
      console.error("保存到本地存储失败:", err);
    }
  };

  // 智能刷新，只在必要时更新数据
  const smartRefresh = async () => {
    // 如果上次刷新时间在3分钟内，且已有数据，直接使用缓存
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.value;
    if (timeSinceLastRefresh < 3 * 60 * 1000 && posts.value.length > 0) {
      console.log("使用现有数据，跳过刷新");
      return posts.value;
    }

    // 超过3分钟或无数据，执行刷新
    console.log("缓存过期或无数据，执行刷新");
    return await fetchPosts(true);
  };

  // 从服务器获取博客文章
  const fetchPosts = async (forceRefresh = false) => {
    try {
      // 如果上次刷新时间在3分钟内，且不是强制刷新，则使用当前数据
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.value;
      if (
        !forceRefresh &&
        timeSinceLastRefresh < 3 * 60 * 1000 &&
        posts.value.length > 0
      ) {
        console.log("使用当前数据，不进行API请求");
        return posts.value;
      }

      isLoading.value = true;
      error.value = null;

      // 首先尝试加载本地缓存
      const localPosts = loadLocalPosts();
      if (localPosts.length > 0 && !forceRefresh) {
        posts.value = localPosts;
      }

      // 然后从服务器获取最新数据，只获取已发布的文章
      console.log("从服务器获取博客数据...");
      const response = await axios.get(`${API_URL}/posts?status=published`);
      posts.value = response.data.data;
      lastRefreshTime.value = Date.now();

      // 缓存到本地存储
      saveToLocalStorage(posts.value);

      return posts.value;
    } catch (err) {
      error.value = err.message || "加载博客文章失败";
      console.error("加载博客文章失败:", err);

      // 如果服务器请求失败，但本地有缓存，继续使用本地缓存
      if (posts.value.length === 0) {
        posts.value = loadLocalPosts();
      }

      return posts.value;
    } finally {
      isLoading.value = false;
    }
  };

  // 清除缓存并强制刷新
  const refreshData = async () => {
    try {
      console.log("强制刷新博客数据");
      // 清除本地存储
      localStorage.removeItem("blog_posts");
      localStorage.removeItem("blog_posts_time");

      // 标记更新，通知其他标签页
      markUpdate();

      // 强制从服务器获取最新数据
      return await fetchPosts(true);
    } catch (err) {
      error.value = err.message || "刷新博客数据失败";
      console.error("刷新博客数据失败:", err);
    }
  };

  // 获取单个博客文章
  const fetchPost = async (id, forceRefresh = false) => {
    try {
      isLoading.value = true;
      error.value = null;

      // 先查找本地是否有这篇文章
      const localPost = posts.value.find(
        (post) => post.id?.toString() === id?.toString() || post._id === id
      );
      if (localPost && localPost.status === "published" && !forceRefresh) {
        return localPost;
      }

      // 从服务器获取文章
      console.log("从服务器获取文章ID:", id);
      const response = await axios.get(`${API_URL}/posts/${id}`);
      const post = response.data.data;
      console.log("服务器返回的文章:", post);

      // 检查文章状态
      if (post.status !== "published") {
        console.log("文章未发布，无法访问");
        return null;
      }

      // 更新本地缓存
      const postIndex = posts.value.findIndex(
        (p) => p.id?.toString() === id?.toString() || p._id === id
      );
      if (postIndex !== -1) {
        posts.value[postIndex] = post;
      } else {
        posts.value.push(post);
      }

      // 更新本地存储
      saveToLocalStorage(posts.value);

      return post;
    } catch (err) {
      error.value = err.message || "获取博客文章失败";
      console.error("获取博客文章失败:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 计算所有分类
  const categories = computed(() => {
    const categorySet = new Set();
    posts.value.forEach((post) => {
      if (post.category && typeof post.category === "object") {
        categorySet.add(post.category.name);
      } else if (post.category) {
        categorySet.add(post.category);
      }
    });
    return [...categorySet];
  });

  // 计算所有标签
  const tags = computed(() => {
    const tagSet = new Set();
    posts.value.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (typeof tag === "object" && tag.name) {
            tagSet.add(tag.name);
          } else if (tag) {
            tagSet.add(tag);
          }
        });
      }
    });
    return [...tagSet];
  });

  // 获取博客文章通过 ID
  const getPostById = (id) => {
    console.log("查找文章ID:", id);
    if (!id) return null;

    // 先从本地查找
    const post = posts.value.find(
      (post) => post._id === id || post.id?.toString() === id?.toString()
    );

    if (post) {
      console.log("在本地找到文章:", post);
      return post;
    }

    // 如果本地没有，从服务器获取
    console.log("本地没有文章，从服务器获取");
    return fetchPost(id);
  };

  // 获取博客文章通过分类
  const getPostsByCategory = (categoryName) => {
    return posts.value.filter((post) => {
      if (post.category && typeof post.category === "object") {
        return post.category.name === categoryName;
      }
      return post.category === categoryName;
    });
  };

  // 获取博客文章通过标签
  const getPostsByTag = (tagName) => {
    return posts.value.filter((post) => {
      if (Array.isArray(post.tags)) {
        return post.tags.some((tag) => {
          if (typeof tag === "object" && tag.name) {
            return tag.name === tagName;
          }
          return tag === tagName;
        });
      }
      return false;
    });
  };

  // 从 Markdown 文件添加文章 (本地和远程)
  const addPostFromMarkdown = async (file, options = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      // 创建 FormData 对象
      const formData = new FormData();
      formData.append("file", file);

      if (options.category) {
        formData.append("category", options.category);
      }

      if (options.tags) {
        formData.append("tags", options.tags.join(","));
      }

      // 上传到服务器
      const response = await axios.post(
        `${API_URL}/admin/upload-post`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newPost = response.data.data;

      // 更新本地状态
      posts.value.push(newPost);

      // 更新本地缓存
      localStorage.setItem("blog_posts", JSON.stringify(posts.value));

      return newPost;
    } catch (err) {
      error.value = err.message || "上传博客文章失败";
      console.error("上传博客文章失败:", err);

      // 如果服务器不可用，仍然创建本地文章
      if (!navigator.onLine) {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
          reader.onload = (e) => {
            try {
              const content = e.target.result;

              // 提取标题
              const titleMatch = content.match(/^#\s+(.+)$/m);
              const title =
                options.title ||
                (titleMatch ? titleMatch[1] : file.name.replace(/\.md$/, ""));

              // 生成本地ID
              const maxId =
                posts.value.length > 0
                  ? Math.max(...posts.value.map((post) => post.id || 0))
                  : 0;
              const id = maxId + 1;

              // 创建本地文章
              const newPost = {
                id,
                title,
                content,
                date: options.date || new Date().toISOString().split("T")[0],
                category: options.category || "未分类",
                tags: options.tags || [],
                status: "draft",
                _isLocal: true, // 标记为本地创建，未同步
              };

              // 添加到本地状态
              posts.value.push(newPost);

              // 更新本地缓存
              localStorage.setItem("blog_posts", JSON.stringify(posts.value));

              resolve(newPost);
            } catch (err) {
              reject(new Error("处理 Markdown 文件失败: " + err.message));
            }
          };

          reader.onerror = () => reject(new Error("读取文件失败"));
          reader.readAsText(file);
        });
      }

      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 初始加载数据
  fetchPosts();

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    fetchPost,
    categories,
    tags,
    getPostById,
    getPostsByCategory,
    getPostsByTag,
    addPostFromMarkdown,
    refreshData,
    smartRefresh,
    markUpdate,
  };
});
