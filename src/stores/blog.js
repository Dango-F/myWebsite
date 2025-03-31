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
  const lastUpdated = ref(new Date());

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
    // 获取当前值并比较，只有在必要时才更新
    const currentValue = localStorage.getItem(LAST_UPDATE_KEY);
    const currentTime = currentValue ? parseInt(currentValue) : 0;

    // 如果距离上次更新不足1秒，跳过更新通知
    // 这可以防止在短时间内多次触发不必要的更新
    if (now - currentTime < 1000) {
      console.log("短时间内已通知更新，跳过重复通知");
      lastRefreshTime.value = now;
      return;
    }

    // 设置新值
    localStorage.setItem(LAST_UPDATE_KEY, now.toString());
    lastRefreshTime.value = now;
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
  const saveToLocalStorage = (data, shouldNotify = true) => {
    try {
      // 比较当前数据和要保存的数据
      const currentData = localStorage.getItem("blog_posts");
      const newDataString = JSON.stringify(data);

      // 如果数据没有变化，不进行存储操作
      if (currentData === newDataString) {
        console.log("数据未变化，跳过本地存储更新");
        return;
      }

      localStorage.setItem("blog_posts", newDataString);
      localStorage.setItem("blog_posts_time", Date.now().toString());

      // 只有在数据确实发生变化且需要通知时才标记更新
      if (shouldNotify) {
        markUpdate();
      } else {
        console.log("静默更新本地存储，不通知其他标签页");
      }
    } catch (err) {
      console.error("保存到本地存储失败:", err);
    }
  };

  // 智能刷新，只在必要时更新数据
  const smartRefresh = async () => {
    // 如果页面初次加载或posts为空，则需要刷新
    if (posts.value.length === 0) {
      console.log("无数据，执行初始化加载");
      return await fetchPosts(false); // 不强制刷新，允许使用本地缓存
    }

    // 检查上次刷新时间
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.value;

    // 如果已有数据且刷新间隔较短，直接使用现有数据
    if (timeSinceLastRefresh < 5 * 60 * 1000) { // 延长到5分钟
      console.log("近期已刷新，使用现有数据");
      return posts.value;
    }

    // 检查是否有其他页面已经刷新过数据
    const lastUpdateFromStorage = localStorage.getItem(LAST_UPDATE_KEY);
    if (lastUpdateFromStorage) {
      const lastUpdateTime = parseInt(lastUpdateFromStorage);

      // 如果其他页面在1分钟内已经刷新过，则无需再次刷新
      if (now - lastUpdateTime < 60 * 1000) {
        console.log("其他页面近期已刷新数据，跳过API请求");
        // 更新本地刷新时间，但不触发API请求
        lastRefreshTime.value = now;
        return posts.value;
      }
    }

    // 超过时间阈值，执行普通刷新（不强制）
    console.log("缓存过期，执行普通刷新");
    return await fetchPosts(false);
  };

  // 从服务器获取博客文章
  const fetchPosts = async (forceRefresh = false) => {
    try {
      // 如果上次刷新时间在5分钟内，且不是强制刷新，则使用当前数据
      // 延长缓存时间，减少API请求频率
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.value;
      if (
        !forceRefresh &&
        timeSinceLastRefresh < 5 * 60 * 1000 &&
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

      // 限制API请求频率
      let shouldFetchFromServer = forceRefresh;

      // 未强制刷新时，检查上次服务器请求时间
      if (!shouldFetchFromServer) {
        const lastApiCallTime = localStorage.getItem("blog_last_api_call");
        const minApiCallInterval = 30 * 1000; // 至少30秒间隔

        if (!lastApiCallTime ||
          Date.now() - parseInt(lastApiCallTime) > minApiCallInterval) {
          shouldFetchFromServer = true;
        } else {
          console.log("API请求过于频繁，使用本地数据");
        }
      }

      // 从服务器获取最新数据，只获取已发布的文章
      if (shouldFetchFromServer) {
        console.log("从服务器获取博客数据...");
        const response = await axios.get(`${API_URL}/posts?status=published`);

        // 记录API调用时间
        localStorage.setItem("blog_last_api_call", Date.now().toString());

        // 比较数据是否有变化
        const serverPostsJson = JSON.stringify(response.data.data);
        const currentPostsJson = JSON.stringify(posts.value);

        if (serverPostsJson !== currentPostsJson) {
          posts.value = response.data.data;
          // 缓存到本地存储 (saveToLocalStorage已优化，只有数据变化时才会通知)
          saveToLocalStorage(posts.value, true);
        } else {
          console.log("服务器数据无变化，跳过更新");
          // 即使数据无变化，也更新刷新时间
          lastRefreshTime.value = Date.now();
        }
      }

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

  // 刷新博客数据
  const refreshData = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // 从API加载所有文章
      const response = await axios.get(`${API_URL}/posts`);
      posts.value = response.data.data;

      // 更新本地存储并明确指定通知其他标签页
      saveToLocalStorage(posts.value, true);

      // 标记最后更新时间
      lastUpdated.value = new Date();

      return posts.value;
    } catch (err) {
      error.value = err.message || "加载博客文章失败";
      console.error("加载博客文章失败:", err);
      throw err;
    } finally {
      isLoading.value = false;
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

      // 更新本地存储但不通知其他标签页（避免弹出更新提示）
      saveToLocalStorage(posts.value, false);

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

    // 如果本地没有，从服务器获取 (设置为不通知，避免仅读取单篇文章时触发更新提示)
    console.log("本地没有文章，从服务器获取");
    return fetchPost(id, false);
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

      // 更新本地缓存并通知（这是主动上传，应该通知）
      saveToLocalStorage(posts.value, true);

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
              saveToLocalStorage(posts.value, true);

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

  // 初始加载数据时添加随机延迟，避免多个标签页同时请求
  const initialLoadWithDebounce = () => {
    // 随机延迟0-1000毫秒，减少多个标签页同时请求的概率
    const delay = Math.floor(Math.random() * 1000);

    // 检查是否其他页面正在加载
    const loadingFlag = localStorage.getItem("blog_loading");
    const now = Date.now();

    if (loadingFlag) {
      const loadStartTime = parseInt(loadingFlag);
      // 如果有其他页面在2秒内开始了加载，则等待更长时间
      if (now - loadStartTime < 2000) {
        console.log("检测到其他页面正在加载，增加等待时间...");
        setTimeout(() => {
          // 尝试智能刷新，可能会重用其他页面已加载的数据
          smartRefresh();
        }, delay + 1500);
        return;
      }
    }

    // 标记当前页面正在加载
    localStorage.setItem("blog_loading", now.toString());

    setTimeout(() => {
      fetchPosts();
      // 加载完成后清除标记
      localStorage.removeItem("blog_loading");
    }, delay);
  };

  // 初始加载使用带防抖的方法
  initialLoadWithDebounce();

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

