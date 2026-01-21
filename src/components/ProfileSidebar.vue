<script setup>
import { useProfileStore } from "@/stores/profile";
import { useSidebarStore } from "@/stores/sidebar";
import { useEditModeStore } from "@/stores/editMode";
import { useAuthStore } from "@/stores/auth";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import ProfileEditor from "./ProfileEditor.vue";

const profileStore = useProfileStore();
const authStore = useAuthStore();
const { profile } = storeToRefs(profileStore);

const sidebarStore = useSidebarStore();
const editModeStore = useEditModeStore();
const isCollapsed = computed(() => sidebarStore.isCollapsed);

const showProfileEditor = ref(false);
const dragIndex = ref(null);

// 登出/Token 过期时，强制关闭编辑弹窗（防止同路由刷新/特殊场景残留）
watch(
  () => authStore.isAuthenticated,
  (isAuthed) => {
    if (!isAuthed) {
      showProfileEditor.value = false;
    }
  }
);

const toggleSidebar = () => {
  sidebarStore.toggleSidebar();
};

const openProfileEditor = () => {
  showProfileEditor.value = true;
};

const closeProfileEditor = () => {
  showProfileEditor.value = false;
};

const onProfileSaved = () => {
  // 配置已保存，刷新显示
  console.log('Profile saved successfully');
};

const alert = (message) => {
  window.alert(message);
};

const onDragStart = (event, index) => {
  dragIndex.value = index;
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
};

const onDrop = async (index) => {
  if (dragIndex.value === null) return;
  const fromIndex = dragIndex.value;
  dragIndex.value = null;
  if (fromIndex === index) return;

  const previousSkills = [...profile.value.skills];
  const nextSkills = [...previousSkills];
  const [moved] = nextSkills.splice(fromIndex, 1);
  nextSkills.splice(index, 0, moved);
  profile.value.skills = nextSkills;

  try {
    await profileStore.updateSkills(nextSkills);
  } catch (error) {
    profile.value.skills = previousSkills;
    console.error(error);
  }
};

const onDragEnd = () => {
  dragIndex.value = null;
};
</script>

<template>
  <div
    class="relative transition-all duration-300"
    :class="{ 'w-8': isCollapsed, 'w-full': !isCollapsed }"
  >
    <!-- 侧边栏内容 - 展开状态 -->
    <transition name="fade">
      <div
        v-if="!isCollapsed"
        class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md shadow-sm sticky top-20 relative transition-all duration-300 max-w-[300px]"
      >
        <!-- 展开状态的折叠按钮 -->
        <button
          @click="toggleSidebar"
          class="no-hover-effect absolute -right-4 top-10 z-10 flex items-center justify-center w-4 h-14 rounded-r-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
        >
          <svg
            class="w-3 h-3 text-[var(--color-text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </button>

        <!-- 个人信息部分 -->
        <div class="flex flex-col items-center text-center p-4">
          <div class="relative mb-3">
            <img
              :src="profile.avatar"
              alt="Profile Avatar"
              class="w-32 h-32 rounded-full border border-[var(--color-border)]"
            />
            <button
              v-if="authStore.isAuthenticated"
              @click="openProfileEditor"
              class="absolute bottom-0 right-0 p-2 bg-github-blue text-white rounded-full hover:bg-blue-700 shadow-md transition-all"
              title="编辑个人信息"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
          <h2 class="text-xl font-semibold mb-1">{{ profile.name }}</h2>
          <p class="text-[var(--color-text-secondary)] text-sm mb-2">
            {{ profile.position }}
          </p>

          <p class="text-[var(--color-text-secondary)] text-sm mb-3">
            {{ profile.bio }}
          </p>
        </div>

        <!-- 基本信息部分 -->
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <div
            class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2"
            v-if="profile.company"
          >
            <svg
              class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]"
              viewBox="0 0 1024 1024"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M485.2 661.4c4.3 2 9.3 2 13.6 0l232-110V709c0 6.1-3.4 11.6-8.8 14.3L499.1 835.6c-4.5 2.3-9.8 2.3-14.2 0L202.7 723.4c-5.4-2.7-8.8-8.2-8.8-14.3V551.4l291.3 110z m344.3-289.8v436.1c0 16.4-13.3 29.7-29.7 29.7s-29.7-13.3-29.7-29.7V383.8l-39.4 9.2v109.4L492 615.6 193.9 502.4v-113l-77.3-24.9c-6.1-2.4-10.2-8.3-10.2-14.9s4-12.5 10.2-14.9L486.1 187c3.8-1.5 8-1.5 11.7 0l369.6 147.7c6.1 2.4 10.1 8.3 10.1 14.9s-4 12.5-10.1 14.9l-37.9 7.1z"
              ></path>
            </svg>
            <span>{{ profile.company }}</span>
          </div>
          <div
            class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2"
            v-if="profile.location"
          >
            <svg
              class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Zm-1.06-8.132a5 5 0 0 0-7.072 7.072L8 14.07l3.536-3.534a5 5 0 0 0 0-7.072ZM8 9a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 9Z"
              ></path>
            </svg>
            <span>{{ profile.location }}</span>
          </div>
          <div
            class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2"
            v-if="profile.email"
          >
            <svg
              class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z"
              ></path>
            </svg>
            <a
              :href="`mailto:${profile.email}`"
              class="text-[var(--color-link)] hover:underline"
              >{{ profile.email }}</a
            >
          </div>
          <div
            class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2"
            v-if="profile.website"
          >
            <svg
              class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z"
              ></path>
            </svg>
            <a
              :href="profile.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-link)] hover:underline"
              >{{ profile.website }}</a
            >
          </div>
          <div
            class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2"
            v-if="profile.qq"
          >
            <svg
              class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]"
              viewBox="0 0 1024 1024"
              fill="currentColor"
              aria-hidden="true"
              style="transform: scale(1.2)"
            >
              <path
                d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"
              />
            </svg>
            <span>{{ profile.qq }}</span>
          </div>
          <div
            class="flex items-center text-[var(--color-text-secondary)] text-sm mb-2"
            v-if="profile.wechat"
          >
            <svg
              class="mr-2 h-4 w-4 text-[var(--color-text-secondary)]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.325.325 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.988 5.853-1.763-.45-3.418-3.931-6.423-8.596-6.423zm-1.527 3.577a1.048 1.048 0 11-.004 2.096 1.048 1.048 0 01.004-2.096zm4.988 0a1.048 1.048 0 11-.005 2.096 1.048 1.048 0 01.005-2.096zM24 14.875c0-3.421-3.384-6.188-7.56-6.188-4.177 0-7.56 2.767-7.56 6.188 0 3.42 3.383 6.186 7.56 6.186.843 0 1.656-.144 2.418-.39a.679.679 0 01.558.07l1.5.83a.368.368 0 00.167.047.305.305 0 00.291-.306c0-.055-.012-.109-.036-.164l-.316-1.094a.672.672 0 01.193-.641A5.909 5.909 0 0024 14.875zm-10.001-1.08a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55zm4.984 0a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55z"
              />
            </svg>
            <span>{{ profile.wechat }}</span>
          </div>
        </div>

        <!-- 技能部分 -->
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <h3 class="font-medium mb-2 text-[var(--color-text-primary)]">
            技能
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in profile.skills"
              :key="skill"
              class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 transition-colors select-none"
              :class="[dragIndex === index ? 'opacity-60' : '', authStore.isAuthenticated ? 'hover:bg-blue-200 dark:hover:bg-blue-800 cursor-move' : '']"
              :draggable="authStore.isAuthenticated"
              @dragstart="authStore.isAuthenticated ? onDragStart($event, index) : null"
              @dragover.prevent
              @drop="authStore.isAuthenticated ? onDrop(index) : null"
              @dragend="authStore.isAuthenticated ? onDragEnd() : null"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- 社交媒体部分 -->
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <h3 class="font-medium mb-2 text-[var(--color-text-primary)]">
            社交媒体
          </h3>
          <div class="flex space-x-4">
            <a
              v-if="profile.github"
              :href="profile.github"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-link)] transition-colors"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
                ></path>
              </svg>
            </a>
            <a
              v-if="profile.qq"
              href="#"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-link)] transition-colors"
              @click.prevent="alert('QQ: ' + profile.qq)"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 1024 1024"
                fill="currentColor"
                style="transform: scale(1.2)"
              >
                <path
                  d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"
                />
              </svg>
            </a>
            <a
              v-if="profile.wechat"
              href="#"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-link)] transition-colors"
              @click.prevent="alert('微信: ' + profile.wechat)"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.325.325 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.988 5.853-1.763-.45-3.418-3.931-6.423-8.596-6.423zm-1.527 3.577a1.048 1.048 0 11-.004 2.096 1.048 1.048 0 01.004-2.096zm4.988 0a1.048 1.048 0 11-.005 2.096 1.048 1.048 0 01.005-2.096zM24 14.875c0-3.421-3.384-6.188-7.56-6.188-4.177 0-7.56 2.767-7.56 6.188 0 3.42 3.383 6.186 7.56 6.186.843 0 1.656-.144 2.418-.39a.679.679 0 01.558.07l1.5.83a.368.368 0 00.167.047.305.305 0 00.291-.306c0-.055-.012-.109-.036-.164l-.316-1.094a.672.672 0 01.193-.641A5.909 5.909 0 0024 14.875zm-10.001-1.08a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55zm4.984 0a.776.776 0 11.005-1.551.776.776 0 01-.005 1.55z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </transition>

    <!-- 折叠时只显示头像 -->
    <transition name="fade">
      <div
        v-if="isCollapsed"
        class="bg-[var(--color-bg-primary)] border-r border-y border-[var(--color-border)] h-screen fixed left-0 top-0 pt-20 w-8 flex flex-col items-center transition-all duration-300"
      >
        <div class="mb-4 mt-4">
          <img
            :src="profile.avatar"
            alt="Profile Avatar"
            class="w-6 h-6 rounded-full border border-[var(--color-border)]"
          />
        </div>

        <!-- 折叠按钮直接吸附在侧边栏上 - 修复hover引起的移动问题 -->
        <button
          @click="toggleSidebar"
          class="no-hover-effect absolute -right-4 top-20 z-10 flex items-center justify-center w-4 h-14 rounded-r-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
        >
          <svg
            class="w-3 h-3 text-[var(--color-text-secondary)] rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </button>
      </div>
    </transition>

    <!-- 个人信息编辑器 -->
    <ProfileEditor v-if="showProfileEditor" @close="closeProfileEditor" @saved="onProfileSaved" />
  </div>
</template>

<style scoped>
.no-hover-effect,
.no-hover-effect:focus {
  filter: none !important;
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
  background: var(--color-bg-secondary) !important;
}

.no-hover-effect:hover {
  filter: none !important;
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
  background: var(--color-bg-tertiary) !important;
}
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
