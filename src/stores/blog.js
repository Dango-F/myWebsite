import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useBlogStore = defineStore('blog', () => {
    // 从本地存储加载博客文章
    const loadStoredPosts = () => {
        try {
            const storedPosts = localStorage.getItem('blog_posts')
            if (storedPosts) {
                return JSON.parse(storedPosts)
            }
        } catch (err) {
            console.error('从本地存储加载博客失败:', err)
        }

        // 默认示例文章
        return [
            {
                id: 1,
                title: 'GitHub风格的个人博客搭建',
                content: '# GitHub风格的个人博客搭建\n\n这是一篇关于如何使用Vue 3和Tailwind CSS搭建GitHub风格个人博客的文章。\n\n## 使用技术\n\n- Vue 3\n- Tailwind CSS\n- Markdown\n\n```js\n// 示例代码\nconst app = createApp(App)\napp.use(createPinia())\napp.use(router)\n```',
                date: '2023-03-29',
                tags: ['Vue', 'Tailwind', 'GitHub'],
                category: '前端开发'
            },
            {
                id: 2,
                title: 'Markdown渲染最佳实践',
                content: '# Markdown渲染最佳实践\n\n在Vue应用中渲染Markdown内容的几种方式及其优缺点分析。\n\n## 主要工具\n\n- markdown-it\n- highlight.js\n\n```js\nimport MarkdownIt from "markdown-it"\nimport hljs from "highlight.js"\n\nconst md = new MarkdownIt({\n  highlight: function(str, lang) {\n    if (lang && hljs.getLanguage(lang)) {\n      return hljs.highlight(str, { language: lang }).value\n    }\n    return ""\n  }\n})\n```',
                date: '2023-03-30',
                tags: ['Markdown', 'Vue', 'JavaScript'],
                category: '技术分享'
            }
        ]
    }

    // 初始化博客文章列表
    const posts = ref(loadStoredPosts())

    // 监听博客文章变化，保存到本地存储
    watch(posts, (newPosts) => {
        try {
            localStorage.setItem('blog_posts', JSON.stringify(newPosts))
        } catch (err) {
            console.error('保存博客到本地存储失败:', err)
        }
    }, { deep: true })

    const categories = computed(() => {
        const categorySet = new Set()
        posts.value.forEach(post => categorySet.add(post.category))
        return [...categorySet]
    })

    const tags = computed(() => {
        const tagSet = new Set()
        posts.value.forEach(post => post.tags.forEach(tag => tagSet.add(tag)))
        return [...tagSet]
    })

    const getPostById = (id) => {
        return posts.value.find(post => post.id === parseInt(id))
    }

    const getPostsByCategory = (category) => {
        return posts.value.filter(post => post.category === category)
    }

    const getPostsByTag = (tag) => {
        return posts.value.filter(post => post.tags.includes(tag))
    }

    // 从Markdown文件内容添加新博客
    const addPostFromMarkdown = (file, options = {}) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const content = e.target.result

                    // 从Markdown内容中提取标题（第一个#开头的行）
                    const titleMatch = content.match(/^#\s+(.+)$/m)
                    const title = options.title || (titleMatch ? titleMatch[1] : file.name.replace(/\.md$/, ''))

                    // 生成新的唯一ID（当前最大ID + 1）
                    const maxId = posts.value.length > 0
                        ? Math.max(...posts.value.map(post => post.id))
                        : 0
                    const id = maxId + 1

                    // 创建新博客文章对象
                    const newPost = {
                        id,
                        title,
                        content,
                        date: options.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD格式
                        category: options.category || '未分类',
                        tags: options.tags || []
                    }

                    // 添加到博客列表
                    posts.value.push(newPost)

                    // 保存状态会通过watch自动进行

                    resolve(newPost)
                } catch (err) {
                    reject(new Error('处理Markdown文件时出错: ' + err.message))
                }
            }

            reader.onerror = () => reject(new Error('读取文件失败'))

            // 开始读取文件
            reader.readAsText(file)
        })
    }

    return {
        posts,
        categories,
        tags,
        getPostById,
        getPostsByCategory,
        getPostsByTag,
        addPostFromMarkdown
    }
}) 