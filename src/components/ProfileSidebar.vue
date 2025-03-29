<script setup>
import { useProfileStore } from '@/stores/profile'
import { useSidebarStore } from '@/stores/sidebar'
import { computed } from 'vue'

const profileStore = useProfileStore()
const { profile } = profileStore

const sidebarStore = useSidebarStore()
const isCollapsed = computed(() => sidebarStore.isCollapsed)

const toggleSidebar = () => {
  sidebarStore.toggleSidebar()
}

const alert = (message) => {
  window.alert(message)
}
</script>

<template>
  <div class="relative transition-all duration-300" :class="{ 'w-8': isCollapsed, 'w-full': !isCollapsed }">
    <!-- 侧边栏内容 - 展开状态 -->
    <transition name="fade">
      <div v-if="!isCollapsed"
        class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md shadow-sm sticky top-20 relative transition-all duration-300 max-w-[300px]">
        <!-- 展开状态的折叠按钮 -->
        <button @click="toggleSidebar"
          class="absolute -right-4 top-10 z-10 flex items-center justify-center w-4 h-14 rounded-r-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-all duration-300 shadow-[2px_0_8px_rgba(0,0,0,0.1)] hover:shadow-[3px_0_12px_rgba(0,0,0,0.15)] hover:bg-[var(--color-bg-tertiary)]">
          <svg class="w-3 h-3 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>



        <!-- 个人信息部分 -->
        <div class="flex flex-col items-center text-center p-4">
          <img :src="profile.avatar" alt="Profile Avatar"
            class="w-32 h-32 rounded-full mb-3 border border-[var(--color-border)]">
          <h2 class="text-xl font-semibold mb-1">{{ profile.name }}</h2>
          <p class="text-[var(--color-text-secondary)] text-sm mb-2">{{ profile.position }}</p>

          <p class="text-[var(--color-text-secondary)] text-sm mb-3">{{ profile.bio }}</p>
        </div>

        <!-- 基本信息部分 -->
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <div class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2" v-if="profile.company">
            <svg class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" viewBox="0 0 16 16" fill="currentColor"
              aria-hidden="true">
              <path
                d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM5.75 16a.75.75 0 0 1-.75-.75V14h-3a1.75 1.75 0 0 1-1.75-1.75V1.75C.25.784.784.25 1.75.25h8.5c.966 0 1.75.534 1.75 1.5v12.5A1.75 1.75 0 0 1 10.25 16h-2.5a.75.75 0 0 1-.75-.75V14h-1.25Zm5.75-6.5v5.25c0 .138.112.25.25.25h2.25a.25.25 0 0 0 .25-.25v-4.5a.75.75 0 0 1 .75-.75h.25a.25.25 0 0 0 .25-.25v-4.5A1.75 1.75 0 0 0 14.25 3h-2.5a.25.25 0 0 0-.25.25v5.5a.75.75 0 0 1-.75.75Zm-8.25.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5Z">
              </path>
            </svg>
            <span>{{ profile.company }}</span>
          </div>
          <div class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2" v-if="profile.location">
            <svg class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" viewBox="0 0 16 16" fill="currentColor"
              aria-hidden="true">
              <path
                d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Zm-1.06-8.132a5 5 0 0 0-7.072 7.072L8 14.07l3.536-3.534a5 5 0 0 0 0-7.072ZM8 9a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 9Z">
              </path>
            </svg>
            <span>{{ profile.location }}</span>
          </div>
          <div class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2" v-if="profile.email">
            <svg class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" viewBox="0 0 16 16" fill="currentColor"
              aria-hidden="true">
              <path
                d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z">
              </path>
            </svg>
            <a :href="`mailto:${profile.email}`" class="text-[var(--color-link)] hover:underline">{{ profile.email
            }}</a>
          </div>
          <div class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2" v-if="profile.website">
            <svg class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" viewBox="0 0 16 16" fill="currentColor"
              aria-hidden="true">
              <path
                d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z">
              </path>
            </svg>
            <a :href="profile.website" target="_blank" rel="noopener noreferrer"
              class="text-[var(--color-link)] hover:underline">{{
                profile.website }}</a>
          </div>
          <div class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2" v-if="profile.qq">
            <svg class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="currentColor"
              aria-hidden="true">
              <path
                d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.018-.236.028-.476.028-.715C19.541 4.403 16.205 1 12.03 1 7.856 1 4.52 4.402 4.52 9.361c0 .255.013.51.04.765a39.89 39.89 0 0 0-1.013 2.584 27.97 27.97 0 0 0-.86 2.33c-.696 2.348-.166 3.33.358 3.47.355.094 1.384-.286 2.312-1.426l.157-.195c.316 1.53 1.126 2.885 2.262 3.915a9.504 9.504 0 0 0 2.836 1.684 7.656 7.656 0 0 0 2.44.415l.62.002c3.15.023 6.058-1.664 7.535-4.303.737.867 1.462 1.275 1.736 1.19.52-.143 1.048-1.133.352-3.482zm-9.368 4.883l-.017-.006-.618.001a6.562 6.562 0 0 1-2.085-.354 8.408 8.408 0 0 1-2.509-1.492c-1.024-.927-1.73-2.089-1.97-3.235l-.159-.757-.598.485c-.28.228-.574.417-.868.566a5.815 5.815 0 0 1-.287.132 5.889 5.889 0 0 1 .157-.426c.071-.174.158-.344.262-.505.169-.261.382-.608.63-1.036a29.698 29.698 0 0 1 1.457-2.385c.31-2.086.8-3.694 1.407-4.315.197-.2.382-.299.548-.299.153 0 .261.059.35.106.239.126.404.328.493.603l.013.039.034.022c.107.07.319.208.514.462.156.204.324.496.324 1.08 0 .561-.223.845-.529 1.128-.112.104-.233.186-.235.187l-.307.186.352.043c.05.006.101.018.148.35.107.039.224.09.33.175.096.078.192.182.253.357l.23.066.058.036a.776.776 0 0 1 .112.082c.078.063.131.116.131.308l-.005.086.017.085a1.606 1.606 0 0 1-.009 1.002l-.069.18.147.126c.145.125.24.282.296.447.113.329.044.747-.061 1.039l-.054.15.117.104c.283.254.432.637.395 1.016a1.3 1.3 0 0 1-.392.845l-.073.067.003.099c0 .756-.127 1.985-.3 2.365-.465 1.675-2.493 3.165-5.196 3.165zm7.063-3.158c-.327.266-.656.467-.937.585l.042-.333c.042-.336-.024-.671-.184-.949.07-.28.113-.55.125-.81.161-.152.315-.36.397-.631.109-.365.09-.705.027-.918a1.684 1.684 0 0 0-.074-.217c.028-.134.05-.273.069-.414.069-.073.16-.195.24-.367.271.598.616 1.395.912 2.129l.7.173c.714 1.82.79 2.5.73 2.632-.023.048-.097.12-.397.12z" />
            </svg>
            <span>{{ profile.qq }}</span>
          </div>
          <div class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2" v-if="profile.wechat">
            <svg class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="currentColor"
              aria-hidden="true">
              <path
                d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.325.325 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.988 5.853-1.763-.45-3.418-3.931-6.423-8.596-6.423zm-1.527 3.577a1.048 1.048 0 11-.004 2.096 1.048 1.048 0 01.004-2.096zm4.988 0a1.048 1.048 0 11-.005 2.096 1.048 1.048 0 01.005-2.096zM24 14.875c0-3.421-3.384-6.188-7.56-6.188-4.177 0-7.56 2.767-7.56 6.188 0 3.42 3.383 6.186 7.56 6.186.843 0 1.656-.144 2.418-.39a.679.679 0 01.558.07l1.5.83a.368.368 0 00.167.047.305.305 0 00.291-.306c0-.055-.012-.109-.036-.164l-.316-1.094a.672.672 0 01.193-.641A5.909 5.909 0 0024 14.875zm-10.001-1.08a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55zm4.984 0a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55z" />
            </svg>
            <span>{{ profile.wechat }}</span>
          </div>
        </div>

        <!-- 技能部分 -->
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <h3 class="font-medium mb-2 text-[var(--color-text-primary)]">技能</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="skill in profile.skills" :key="skill"
              class="px-2 py-1 text-xs rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- 社交媒体部分 -->
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <h3 class="font-medium mb-2 text-[var(--color-text-primary)]">社交媒体</h3>
          <div class="flex space-x-4">
            <a v-if="profile.github" :href="profile.github" target="_blank" rel="noopener noreferrer"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-link)] transition-colors">
              <svg class="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path
                  d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z">
                </path>
              </svg>
            </a>
            <a v-if="profile.qq" href="#"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-link)] transition-colors"
              @click.prevent="alert('QQ: ' + profile.qq)">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.018-.236.028-.476.028-.715C19.541 4.403 16.205 1 12.03 1 7.856 1 4.52 4.402 4.52 9.361c0 .255.013.51.04.765a39.89 39.89 0 0 0-1.013 2.584 27.97 27.97 0 0 0-.86 2.33c-.696 2.348-.166 3.33.358 3.47.355.094 1.384-.286 2.312-1.426l.157-.195c.316 1.53 1.126 2.885 2.262 3.915a9.504 9.504 0 0 0 2.836 1.684 7.656 7.656 0 0 0 2.44.415l.62.002c3.15.023 6.058-1.664 7.535-4.303.737.867 1.462 1.275 1.736 1.19.52-.143 1.048-1.133.352-3.482zm-9.368 4.883l-.017-.006-.618.001a6.562 6.562 0 0 1-2.085-.354 8.408 8.408 0 0 1-2.509-1.492c-1.024-.927-1.73-2.089-1.97-3.235l-.159-.757-.598.485c-.28.228-.574.417-.868.566a5.815 5.815 0 0 1-.287.132 5.889 5.889 0 0 1 .157-.426c.071-.174.158-.344.262-.505.169-.261.382-.608.63-1.036a29.698 29.698 0 0 1 1.457-2.385c.31-2.086.8-3.694 1.407-4.315.197-.2.382-.299.548-.299.153 0 .261.059.35.106.239.126.404.328.493.603l.013.039.034.022c.107.07.319.208.514.462.156.204.324.496.324 1.08 0 .561-.223.845-.529 1.128-.112.104-.233.186-.235.187l-.307.186.352.043c.05.006.101.018.148.35.107.039.224.09.33.175.096.078.192.182.253.357l.23.066.058.036a.776.776 0 0 1 .112.082c.078.063.131.116.131.308l-.005.086.017.085a1.606 1.606 0 0 1-.009 1.002l-.069.18.147.126c.145.125.24.282.296.447.113.329.044.747-.061 1.039l-.054.15.117.104c.283.254.432.637.395 1.016a1.3 1.3 0 0 1-.392.845l-.073.067.003.099c0 .756-.127 1.985-.3 2.365-.465 1.675-2.493 3.165-5.196 3.165zm7.063-3.158c-.327.266-.656.467-.937.585l.042-.333c.042-.336-.024-.671-.184-.949.07-.28.113-.55.125-.81.161-.152.315-.36.397-.631.109-.365.09-.705.027-.918a1.684 1.684 0 0 0-.074-.217c.028-.134.05-.273.069-.414.069-.073.16-.195.24-.367.271.598.616 1.395.912 2.129l.7.173c.714 1.82.79 2.5.73 2.632-.023.048-.097.12-.397.12z" />
              </svg>
            </a>
            <a v-if="profile.wechat" href="#"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-link)] transition-colors"
              @click.prevent="alert('微信: ' + profile.wechat)">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.325.325 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.988 5.853-1.763-.45-3.418-3.931-6.423-8.596-6.423zm-1.527 3.577a1.048 1.048 0 11-.004 2.096 1.048 1.048 0 01.004-2.096zm4.988 0a1.048 1.048 0 11-.005 2.096 1.048 1.048 0 01.005-2.096zM24 14.875c0-3.421-3.384-6.188-7.56-6.188-4.177 0-7.56 2.767-7.56 6.188 0 3.42 3.383 6.186 7.56 6.186.843 0 1.656-.144 2.418-.39a.679.679 0 01.558.07l1.5.83a.368.368 0 00.167.047.305.305 0 00.291-.306c0-.055-.012-.109-.036-.164l-.316-1.094a.672.672 0 01.193-.641A5.909 5.909 0 0024 14.875zm-10.001-1.08a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55zm4.984 0a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </transition>

    <!-- 折叠时只显示头像 -->
    <transition name="fade">
      <div v-if="isCollapsed"
        class="bg-[var(--color-bg-primary)] border-r border-y border-[var(--color-border)] h-screen fixed left-0 top-0 pt-20 w-8 flex flex-col items-center transition-all duration-300">
        <div class="mb-4 mt-4">
          <img :src="profile.avatar" alt="Profile Avatar"
            class="w-6 h-6 rounded-full border border-[var(--color-border)]">
        </div>

        <!-- 折叠按钮直接吸附在侧边栏上 - 修复hover引起的移动问题 -->
        <button @click="toggleSidebar"
          class="absolute -right-4 top-20 z-10 flex items-center justify-center w-4 h-14 rounded-r-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] transition-all duration-300 shadow-[2px_0_8px_rgba(0,0,0,0.1)] hover:shadow-[3px_0_12px_rgba(0,0,0,0.15)] hover:bg-[var(--color-bg-tertiary)]">
          <svg class="w-3 h-3 text-[var(--color-text-secondary)] rotate-180" fill="none" stroke="currentColor"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>