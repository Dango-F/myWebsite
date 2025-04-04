<script setup>
import { ref, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import { useTodoStore } from "@/stores/todo";
import UserStatus from "@/components/UserStatus.vue";
import ThemeToggler from "@/components/ThemeToggler.vue";
import { useProfileStore } from "@/stores/profile";

const profileStore = useProfileStore();
const { profile } = profileStore;

const themeStore = useThemeStore();
const todoStore = useTodoStore();
const route = useRoute();
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const isActive = (path) => {
  return route.path === path || route.path.startsWith(`${path}/`);
};

// 计算未完成的待办事项数量
const activeTodosCount = computed(() => {
  return todoStore.todos.filter((todo) => !todo.completed).length;
});

// 判断是否有未完成的待办事项
const hasActiveTodos = computed(() => {
  return activeTodosCount.value > 0;
});
</script>

<template>
  <header class="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] sticky top-0 z-10 shadow-sm">
    <div class="container mx-auto px-4 flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <RouterLink to="/" class="text-[var(--color-text-primary)] font-semibold text-xl flex items-center">
          <span class="font-bold">{{ profile.name }}的个人网站</span>
        </RouterLink>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-1">
        <div class="flex items-center">
          <nav class="flex items-center space-x-1 mr-3">
            <RouterLink to="/"
              class="px-3 py-2 rounded-md text-sm font-medium relative transition-colors hover:bg-[var(--color-bg-secondary)]"
              :class="{ 'text-[var(--color-accent-primary)]': isActive('/') }">
              <div class="flex items-center">
                <svg class="mr-1 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H6a.75.75 0 0 0 .75-.75V8.25a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 0 .75.75h3.5a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z">
                  </path>
                </svg>
                首页
              </div>
              <div v-if="isActive('/')"
                class="absolute bottom-0 left-0 h-0.5 bg-[var(--color-accent-primary)] rounded-full w-full"></div>
            </RouterLink>

            <RouterLink to="/blog"
              class="px-3 py-2 rounded-md text-sm font-medium relative transition-colors hover:bg-[var(--color-bg-secondary)]"
              :class="{
                'text-[var(--color-accent-primary)]': isActive('/blog'),
              }">
              <div class="flex items-center">
                <svg class="mr-1 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm11.75 4.5a.75.75 0 0 0 0-1.5h-8.5a.75.75 0 0 0 0 1.5ZM6 8a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5Zm-3 4.75a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Z">
                  </path>
                </svg>
                博客
              </div>
              <div v-if="isActive('/blog')"
                class="absolute bottom-0 left-0 h-0.5 bg-[var(--color-accent-primary)] rounded-full w-full"></div>
            </RouterLink>

            <RouterLink to="/projects"
              class="px-3 py-2 rounded-md text-sm font-medium relative transition-colors hover:bg-[var(--color-bg-secondary)]"
              :class="{
                'text-[var(--color-accent-primary)]': isActive('/projects'),
              }">
              <div class="flex items-center">
                <svg class="mr-1 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z">
                  </path>
                </svg>
                项目
              </div>
              <div v-if="isActive('/projects')"
                class="absolute bottom-0 left-0 h-0.5 bg-[var(--color-accent-primary)] rounded-full w-full"></div>
            </RouterLink>

            <RouterLink to="/resume"
              class="px-3 py-2 rounded-md text-sm font-medium relative transition-colors hover:bg-[var(--color-bg-secondary)]"
              :class="{
                'text-[var(--color-accent-primary)]': isActive('/resume'),
              }">
              <div class="flex items-center">
                <svg class="mr-1 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z">
                  </path>
                </svg>
                简历
              </div>
              <div v-if="isActive('/resume')"
                class="absolute bottom-0 left-0 h-0.5 bg-[var(--color-accent-primary)] rounded-full w-full"></div>
            </RouterLink>

            <RouterLink to="/todo"
              class="px-3 py-2 rounded-md text-sm font-medium relative transition-colors hover:bg-[var(--color-bg-secondary)]"
              :class="{
                'text-[var(--color-accent-primary)]': isActive('/todo'),
              }">
              <div class="flex items-center" :class="{
                'text-red-500': hasActiveTodos,
              }">
                <svg class="mr-1 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v12.5A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25ZM3.75 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z">
                  </path>
                </svg>
                待办<span v-if="hasActiveTodos"
                  class="ml-1 text-xs font-medium bg-red-500 text-white rounded-full px-1.5">{{ activeTodosCount
                  }}</span>
              </div>
              <div v-if="isActive('/todo')"
                class="absolute bottom-0 left-0 h-0.5 bg-[var(--color-accent-primary)] rounded-full w-full"></div>
            </RouterLink>
          </nav>

          <!-- 用户状态组件 -->
          <div class="border-l border-[var(--color-border)] pl-3 relative">
            <UserStatus />
          </div>

          <!-- 主题切换 -->
          <div class="ml-3">
            <ThemeToggler />
          </div>
        </div>
      </div>

      <!-- Mobile Menu Button -->
      <div class="flex md:hidden">
        <!-- 移动端主题切换 -->
        <ThemeToggler />

        <button @click="toggleMenu"
          class="text-[var(--color-text-primary)] p-2 rounded-md hover:bg-[var(--color-bg-secondary)]">
          <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-show="isMenuOpen" class="md:hidden bg-[var(--color-bg-primary)] border-t border-[var(--color-border)]">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <RouterLink to="/" @click="isMenuOpen = false"
          class="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          :class="{ 'text-[var(--color-accent-primary)]': isActive('/') }">
          <div class="flex items-center">
            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H6a.75.75 0 0 0 .75-.75V8.25a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 0 .75.75h3.5a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z">
              </path>
            </svg>
            首页
          </div>
        </RouterLink>

        <RouterLink to="/blog" @click="isMenuOpen = false"
          class="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          :class="{ 'text-[var(--color-accent-primary)]': isActive('/blog') }">
          <div class="flex items-center">
            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm11.75 4.5a.75.75 0 0 0 0-1.5h-8.5a.75.75 0 0 0 0 1.5ZM6 8a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5Zm-3 4.75a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Z">
              </path>
            </svg>
            博客
          </div>
        </RouterLink>

        <RouterLink to="/projects" @click="isMenuOpen = false"
          class="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          :class="{
            'text-[var(--color-accent-primary)]': isActive('/projects'),
          }">
          <div class="flex items-center">
            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z">
              </path>
            </svg>
            项目
          </div>
        </RouterLink>

        <RouterLink to="/resume" @click="isMenuOpen = false"
          class="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          :class="{ 'text-[var(--color-accent-primary)]': isActive('/resume') }">
          <div class="flex items-center">
            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z">
              </path>
            </svg>
            简历
          </div>
        </RouterLink>

        <RouterLink to="/todo" @click="isMenuOpen = false"
          class="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          :class="{ 'text-[var(--color-accent-primary)]': isActive('/todo') }">
          <div class="flex items-center" :class="{ 'text-red-500': hasActiveTodos }">
            <svg class="mr-2 h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v12.5A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25ZM3.75 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z">
              </path>
            </svg>
            待办<span v-if="hasActiveTodos" class="ml-1 text-xs font-medium bg-red-500 text-white rounded-full px-1.5">{{
              activeTodosCount }}</span>
          </div>
        </RouterLink>

        <!-- 用户状态组件 - 移动端 -->
        <div class="border-t border-[var(--color-border)] mt-2 pt-2">
          <UserStatus />
        </div>
      </div>
    </div>
  </header>
</template>
