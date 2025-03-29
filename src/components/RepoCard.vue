<script setup>
defineProps({
  project: {
    type: Object,
    required: true
  }
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<template>
  <div
    class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md p-4 mb-4 hover:border-github-blue transition-colors">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold text-github-blue hover:underline">
          <a :href="project.url" target="_blank" rel="noopener noreferrer">{{ project.name }}</a>
        </h3>
        <p class="text-github-gray mt-1">{{ project.description }}</p>

        <!-- GitHub仓库特有信息 -->
        <p v-if="project.isFromGitHub && project.updated_at" class="text-github-gray text-sm mt-1">
          最近更新于: {{ formatDate(project.updated_at) }}
        </p>
      </div>

      <!-- GitHub标识 -->
      <div v-if="project.isFromGitHub" class="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-github-gray"
          viewBox="0 0 16 16">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-github-gray">
      <div class="flex items-center" v-if="project.language">
        <span class="w-3 h-3 rounded-full mr-1" :class="{
          'bg-yellow-400': project.language === 'JavaScript',
          'bg-blue-500': project.language === 'TypeScript',
          'bg-green-500': project.language === 'Vue',
          'bg-purple-500': project.language === 'CSS',
          'bg-red-500': project.language === 'HTML',
          'bg-gray-500': !['JavaScript', 'TypeScript', 'Vue', 'CSS', 'HTML'].includes(project.language)
        }"></span>
        <span>{{ project.language }}</span>
      </div>

      <div class="flex items-center" v-if="project.stars">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span>{{ project.stars }}</span>
      </div>

      <div class="flex items-center" v-if="project.forks">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>{{ project.forks }}</span>
      </div>

      <!-- 创建日期 -->
      <div class="flex items-center" v-if="project.isFromGitHub && project.created_at">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{{ formatDate(project.created_at) }}</span>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <span v-for="tag in project.tags" :key="tag"
        class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300">
        {{ tag }}
      </span>
    </div>
  </div>
</template>