<script setup>
import { ref, computed } from "vue";
import { useTodoStore } from "@/stores/todo";
import { useAuthStore } from "@/stores/auth";

const todoStore = useTodoStore();
const authStore = useAuthStore();
const newTodo = ref("");
const newCategory = ref("");
const newPriority = ref("");
const filter = ref("all");
const categoryFilter = ref("");
const isRefreshing = ref(false);

const filteredTodos = computed(() => {
  let result = todoStore.todos;

  // 状态过滤
  if (filter.value === "active") {
    result = result.filter((todo) => !todo.completed);
  } else if (filter.value === "completed") {
    result = result.filter((todo) => todo.completed);
  }

  // 分类过滤
  if (categoryFilter.value) {
    result = result.filter((todo) => todo.category === categoryFilter.value);
  }

  return result;
});

const addTodo = () => {
  if (newTodo.value.trim() && newCategory.value && newPriority.value) {
    todoStore.addTodo({
      text: newTodo.value.trim(),
      category: newCategory.value,
      priority: newPriority.value,
    });
    newTodo.value = "";
    newCategory.value = "";
    newPriority.value = "";
  }
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

// 刷新待办事项列表，只在用户点击刷新按钮时触发动画
const refreshTodos = async () => {
  isRefreshing.value = true;
  await todoStore.fetchTodos();
  setTimeout(() => {
    isRefreshing.value = false;
  }, 500); // 保持动画至少显示500毫秒，以便用户看到反馈
};
</script>

<template>
  <div
    class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md p-4"
  >
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">待办事项</h2>
      <button
        @click="refreshTodos"
        class="no-hover-effect text-github-blue hover:text-blue-700"
        :class="{ 'animate-spin': isRefreshing }"
      >
        <!-- <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
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
        </svg> -->
      </button>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="todoStore.error"
      class="mb-4 p-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md"
    >
      {{ todoStore.error }}
    </div>

    <!-- 添加新待办 -->
    <div v-if="authStore.isAuthenticated" class="mb-6 border-b border-[var(--color-border)] pb-4">
      <div class="flex flex-col gap-2">
        <input
          v-model="newTodo"
          @keyup.enter="addTodo"
          type="text"
          placeholder="添加新待办..."
          class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
        />
        <div class="flex gap-2">
          <select
            v-model="newCategory"
            class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
          >
            <option value="" disabled>选择分类</option>
            <option
              v-for="category in todoStore.categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
          <select
            v-model="newPriority"
            class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
          >
            <option value="" disabled>选择优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <button
            @click="addTodo"
            class="no-hover-effect px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700"
            :disabled="todoStore.isLoading"
          >
            {{ todoStore.isLoading ? "添加中..." : "添加" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="mb-4 flex flex-wrap gap-2">
      <div
        class="flex border border-[var(--color-border)] rounded-md overflow-hidden"
      >
        <button
          @click="filter = 'all'"
          :class="[
            'no-hover-effect px-3 py-1',
            filter === 'all'
              ? 'bg-github-blue text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          全部
        </button>
        <button
          @click="filter = 'active'"
          :class="[
            'no-hover-effect px-3 py-1',
            filter === 'active'
              ? 'bg-github-blue text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          未完成
        </button>
        <button
          @click="filter = 'completed'"
          :class="[
            'no-hover-effect px-3 py-1',
            filter === 'completed'
              ? 'bg-github-blue text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          已完成
        </button>
      </div>

      <select
        v-model="categoryFilter"
        class="p-1 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
      >
        <option value="">所有分类</option>
        <option
          v-for="category in todoStore.categories"
          :key="category"
          :value="category"
        >
          {{ category }}
        </option>
      </select>
    </div>

    <!-- 加载指示器 -->
    <div
      v-if="todoStore.isLoading && !filteredTodos.length"
      class="text-center py-4"
    >
      <div
        class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-github-blue"
      ></div>
      <p class="mt-2 text-github-gray">加载中...</p>
    </div>

    <!-- Todo列表 -->
    <div v-else-if="filteredTodos.length">
      <div
        v-for="todo in filteredTodos"
        :key="todo._id || todo.id"
        class="p-3 mb-2 border border-[var(--color-border)] rounded-md flex items-center justify-between"
        :class="{ 'bg-gray-50 dark:bg-gray-800': todo.completed }"
      >
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="todoStore.toggleTodo(todo._id || todo.id)"
            class="h-4 w-4"
          />
          <span :class="{ 'line-through text-github-gray': todo.completed }">
            {{ todo.text }}
          </span>
          <span
            class="ml-2 px-2 py-0.5 text-xs rounded-full"
            :class="getPriorityClass(todo.priority)"
          >
            {{ { high: "高", medium: "中", low: "低" }[todo.priority] }}
          </span>
          <span
            class="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {{ todo.category }}
          </span>
        </div>
        <button
          v-if="authStore.isAuthenticated"
          @click="todoStore.removeTodo(todo._id || todo.id)"
          class="no-hover-effect text-red-500 hover:text-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
    <div v-else class="text-center py-4 text-github-gray">
      没有符合条件的待办事项
    </div>
  </div>
</template>

<style scoped>
.no-hover-effect,
.no-hover-effect:focus,
.no-hover-effect:active {
  filter: none !important;
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
}

.no-hover-effect:hover {
  filter: none !important;
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
}
</style>
