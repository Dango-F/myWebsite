import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useTodoStore } from "@/stores/todo";
import { useProfileStore } from "@/stores/profile";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/change-password",
      name: "change-password",
      component: () => import("../views/ChangePasswordView.vue"),
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

// Global navigation guard: smart refresh on page switch
router.beforeEach(async (to, from, next) => {
  // Skip login page or initial load
  if (to.path === "/login" || !from.path) {
    next();
    return;
  }

  // Smart refresh profile data (5s debounce)
  if (to.path !== "/login") {
    const profileStore = useProfileStore();
    if (profileStore.shouldRefresh()) {
      console.log("Page switch: refreshing profile (cache expired)");
      setTimeout(() => {
        profileStore.fetchProfile();
      }, 0);
    } else {
      console.log("Page switch: using cached profile data");
    }
  }

  // Smart refresh todo data when entering todo page (5s debounce)
  if (to.path.startsWith("/todo")) {
    const todoStore = useTodoStore();
    if (todoStore.shouldRefresh()) {
      console.log("Switching to todo: refreshing data (cache expired)");
      setTimeout(() => {
        todoStore.fetchTodos();
      }, 0);
    } else {
      console.log("Switching to todo: using cached data");
    }
  }

  next();
});

export default router;
