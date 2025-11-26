import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
// 已移除博客功能
import { useTodoStore } from "@/stores/todo";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    // 博客相关路由已删除
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
    // 管理后台已移除
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

// 添加全局路由守卫，在进入博客相关页面时刷新数据
router.beforeEach(async (to, from, next) => {
  // 如果是待办相关页面，刷新待办数据
  if (to.path.startsWith("/todo")) {
    try {
      const todoStore = useTodoStore();
      // 如果不是从其他待办页面过来，或者明确要求刷新
      if (!from.path.startsWith("/todo") || to.query.refresh === "true") {
        console.log("进入待办页面，按需刷新数据");
        // 使用异步方式刷新数据，但不阻塞路由导航
        setTimeout(() => {
          // 使用智能刷新，只在必要时更新数据
          todoStore.smartRefresh();
        }, 0);
      }
    } catch (error) {
      console.error("刷新待办数据失败:", error);
    }
  }

  next();
});

export default router;
