<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'

const profileStore = useProfileStore()
const authStore = useAuthStore()
const { profile } = storeToRefs(profileStore)

const emojiList = [
    { emoji: '😊', name: '微笑' },
    { emoji: '😂', name: '笑哭' },
    { emoji: '😎', name: '酷' },
    { emoji: '🤔', name: '思考' },
    { emoji: '😴', name: '睡觉' },
    { emoji: '😢', name: '哭泣' },
    { emoji: '🎉', name: '庆祝' },
    { emoji: '🤒', name: '生病' },
    { emoji: '💻', name: '编程' },
    { emoji: '🎮', name: '游戏' },
    { emoji: '📚', name: '阅读' },
    { emoji: '🍽️', name: '吃饭' },
    { emoji: '☕', name: '喝咖啡' },
    { emoji: '🏃', name: '跑步' },
    { emoji: '💼', name: '工作' },
    { emoji: '🎵', name: '听音乐' }
]
const isEditing = ref(false)
const statusText = ref('')
const searchQuery = ref('')
const selectedEmoji = ref('')

const syncFromProfile = () => {
    const current = profile.value?.status || { text: '正在编码...', emoji: '💻' }
    statusText.value = current.text
    selectedEmoji.value = current.emoji
}

// 初始化状态
onMounted(() => {
    syncFromProfile()

    // 添加点击事件监听器，用于在点击组件外部时关闭编辑模式
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    // 组件销毁前移除事件监听器
    document.removeEventListener('click', handleClickOutside)
})

// 处理组件外部点击
const handleClickOutside = (event) => {
    const statusEl = document.querySelector('.user-status')
    if (isEditing.value && statusEl && !statusEl.contains(event.target)) {
        cancelEdit()
    }
}

// 阻止事件冒泡
const stopPropagation = (event) => {
    event.stopPropagation()
}

// 根据搜索过滤表情列表
const filteredEmojis = computed(() => {
    if (!searchQuery.value.trim()) return emojiList
    const query = searchQuery.value.toLowerCase()
    return emojiList.filter(
        emoji => emoji.name.toLowerCase().includes(query)
    )
})

// 保存状态
const saveStatus = async () => {
    await profileStore.updateProfile({
        status: {
            text: statusText.value || '正在编码...',
            emoji: selectedEmoji.value
        }
    })
    isEditing.value = false
}

// 取消编辑
const cancelEdit = () => {
    syncFromProfile()
    isEditing.value = false
}

// 开始编辑
const startEdit = (event) => {
    // 只有认证用户才能编辑
    if (!authStore.isAuthenticated) return
    
    // 阻止事件冒泡，避免触发外部点击事件
    if (event) event.stopPropagation()
    isEditing.value = true
}

// 选择表情
const selectEmoji = (emoji) => {
    selectedEmoji.value = emoji
}

watch(
    () => profile.value?.status,
    () => {
        if (!isEditing.value) {
            syncFromProfile()
        }
    },
    { deep: true, immediate: true }
)
</script>

<template>
    <div class="user-status bg-[var(--color-bg-primary)] rounded-md overflow-visible relative">
        <!-- 查看模式 - 始终显示 -->
        <div class="flex items-center rounded-md px-2 py-1"
            :class="authStore.isAuthenticated ? 'cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors' : ''"
            @click="startEdit">
            <div class="flex items-center gap-1">
                <span class="text-base" aria-hidden="true">{{ profile.status?.emoji }}</span>
                <span class="text-[var(--color-text-primary)] text-sm">{{ profile.status?.text }}</span>
            </div>
        </div>

        <!-- 编辑模式 -->
        <div v-if="isEditing" @click="stopPropagation"
            class="space-y-2 p-2 absolute bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md shadow-lg w-64 z-20"
            :class="{ 'right-0 mt-1': true, 'md:right-0 md:left-auto': true }">
            <div class="flex items-center gap-2">
                <span class="text-xl" aria-hidden="true">{{ selectedEmoji }}</span>
                <input v-model="statusText" type="text" placeholder="设置您的状态..."
                    class="flex-1 p-1.5 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
                    maxlength="50" />
            </div>

            <div class="emoji-selector">
                <input v-model="searchQuery" type="text" placeholder="搜索表情..."
                    class="w-full p-1.5 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)] mb-2" />
                <div class="emoji-grid grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                    <button v-for="item in filteredEmojis" :key="item.emoji" @click="selectEmoji(item.emoji)" :class="[
                        'text-xl p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
                        selectedEmoji === item.emoji ? 'bg-gray-100 dark:bg-gray-800' : ''
                    ]" :title="item.name">
                        {{ item.emoji }}
                    </button>
                </div>
            </div>

            <div class="flex justify-end gap-2">
                <button @click="cancelEdit"
                    class="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-[var(--color-bg-secondary)] transition-colors">
                    取消
                </button>
                <button @click="saveStatus"
                    class="px-3 py-1 text-sm bg-github-blue text-white rounded-md hover:bg-blue-700 transition-colors">
                    保存
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.emoji-grid {
    scrollbar-width: thin;
}

.emoji-grid::-webkit-scrollbar {
    width: 6px;
}

.emoji-grid::-webkit-scrollbar-track {
    background: transparent;
}

.emoji-grid::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}
</style>
