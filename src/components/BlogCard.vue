<script setup>
import { computed } from "vue";
import { extractExcerpt, formatDateTime } from "@/utils/markdown";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const excerpt = computed(() => {
  return extractExcerpt(props.post.content, 150);
});

// 格式化第一次发布时间（创建时间）
const formattedDateTime = computed(() => {
  return formatDateTime(props.post.createdAt);
});

// 格式化更新时间（最近一次状态变更时间）
const formattedUpdateTime = computed(() => {
  return formatDateTime(props.post.updatedAt || props.post.date);
});
</script>

<template>
  <div
    class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md p-4 mb-4 hover:border-github-blue transition-colors">
    <div class="mb-3">
      <div class="flex justify-between items-start">
        <h2 class="text-xl font-semibold hover:text-github-blue transition-colors">
          <router-link :to="`/blog/${post._id || post.id}`">{{
            post.title
          }}</router-link>
        </h2>
        <span class="text-github-gray text-sm">{{ formattedDateTime }}</span>
      </div>
      <div class="mt-2 text-github-gray">
        {{ excerpt }}
      </div>
    </div>
    <div class="flex justify-between items-center">
      <div class="flex flex-wrap gap-2">
        <router-link :to="`/blog/category/${typeof post.category === 'object'
          ? post.category.name
          : post.category
          }`"
          class="px-2 py-1 text-xs rounded-full bg-green-100 text-github-green dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
          {{
            typeof post.category === "object"
              ? post.category.name
              : post.category
          }}
        </router-link>
        <router-link v-for="tag in post.tags" :key="typeof tag === 'object' ? tag._id : tag"
          :to="`/blog/tag/${typeof tag === 'object' ? tag.name : tag}`"
          class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
          {{ typeof tag === "object" ? tag.name : tag }}
        </router-link>
      </div>
      <span class="text-github-gray text-xs italic">
        更新于: {{ formattedUpdateTime }}
      </span>
    </div>
  </div>
</template>
