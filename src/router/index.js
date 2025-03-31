import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useBlogStore } from "@/stores/blog";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/blog",
      name: "blog",
      component: () => import("../views/BlogView.vue"),
    },
    {
      path: "/blog/:id",
      name: "blog-detail",
      component: () => import("../views/BlogDetailView.vue"),
    },
    {
      path: "/blog/category/:category",
      name: "blog-category",
      component: () => import("../views/BlogView.vue"),
    },
    {
      path: "/blog/tag/:tag",
      name: "blog-tag",
      component: () => import("../views/BlogView.vue"),
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("../views/ProjectsView.vue"),
    },
    {
      path: "/resume",
      name: "resume",
      component: () => import("../views/ResumeView.vue"),
    },
    {
      path: "/todo",
      name: "todo",
      component: () => import("../views/TodoView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

// 添加全局路由守卫，在进入博客相关页面时刷新数据
router.beforeEach(async (to, from, next) => {
  // 如果是博客相关页面，刷新博客数据
  if (to.path.startsWith("/blog")) {
    try {
      const blogStore = useBlogStore();
      // 如果不是从其他博客页面过来，或者明确要求刷新
      if (!from.path.startsWith("/blog") || to.query.refresh === "true") {
        console.log("进入博客页面，按需刷新数据");
        // 使用异步方式刷新数据，但不阻塞路由导航
        setTimeout(() => {
          // 使用智能刷新，只在必要时更新数据
          blogStore.smartRefresh();
        }, 0);
      }
    } catch (error) {
      console.error("刷新博客数据失败:", error);
    }
  }
  next();
});

export default router;
