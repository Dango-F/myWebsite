<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import { renderMarkdown } from '@/utils/markdown'
import { useSidebarStore } from '@/stores/sidebar'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const sidebarStore = useSidebarStore()

const post = computed(() => {
    const foundPost = blogStore.getPostById(parseInt(route.params.id))
    if (!foundPost) {
        router.push('/blog')
    }
    return foundPost
})

const renderedContent = computed(() => {
    if (!post.value) return ''
    return renderMarkdown(post.value.content)
})

const isCollapsed = computed(() => sidebarStore.isCollapsed)
</script>

<template>
    <div class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6"
            :class="{ 'md:grid-cols-[300px_1fr]': !isCollapsed, 'md:grid-cols-[auto_1fr]': isCollapsed }">
            <!-- 侧边栏 -->
            <div>
                <ProfileSidebar />
            </div>

            <!-- 主内容区 -->
            <div>
                <div class="mb-4">
                    <router-link to="/blog"
                        class="inline-flex items-center text-github-gray hover:text-github-blue mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        返回博客列表
                    </router-link>
                </div>

                <article class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md p-6">
                    <header class="mb-6 border-b border-[var(--color-border)] pb-4">
                        <h1 class="text-2xl font-bold mb-2">{{ post.title }}</h1>
                        <div class="flex items-center text-github-gray text-sm">
                            <span>{{ post.date }}</span>
                            <span class="mx-2">•</span>
                            <router-link :to="`/blog/category/${post.category}`" class="hover:text-github-blue">
                                {{ post.category }}
                            </router-link>
                        </div>
                    </header>

                    <div class="markdown-body prose dark:prose-invert max-w-none" v-html="renderedContent"></div>

                    <footer class="mt-6 pt-4 border-t border-[var(--color-border)]">
                        <div class="flex flex-wrap gap-2">
                            <router-link v-for="tag in post.tags" :key="tag" :to="`/blog/tag/${tag}`"
                                class="px-2 py-1 text-xs rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                                {{ tag }}
                            </router-link>
                        </div>
                    </footer>
                </article>
            </div>
        </div>
    </div>
</template>

<style>
/* GitHub风格Markdown内容样式 */
.markdown-body {
    color: var(--color-text-primary);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
}

.markdown-body h1 {
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid var(--color-border);
}

.markdown-body h2 {
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid var(--color-border);
}

.markdown-body pre {
    padding: 16px;
    overflow: auto;
    border-radius: 6px;
}

.dark .hljs {
    background: #161b22;
}
</style>