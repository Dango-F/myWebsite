<script setup>
import { ref, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const emit = defineEmits(['close', 'saved'])

const timelineItems = ref([])
const isSaving = ref(false)
const saveMessage = ref({ show: false, text: '', isError: false })
const editingIndex = ref(null)
const newItem = ref({
    year: '',
    title: '',
    company: '',
    description: ''
})

// 初始化时间轴数据
onMounted(() => {
    timelineItems.value = JSON.parse(JSON.stringify(profileStore.timeline))
})

// 添加新项目
const addItem = () => {
    if (newItem.value.year && newItem.value.title && newItem.value.company && newItem.value.description) {
        timelineItems.value.unshift({ ...newItem.value })
        newItem.value = { year: '', title: '', company: '', description: '' }
    }
}

// 删除项目
const removeItem = (index) => {
    if (confirm('确定要删除这个时间轴项目吗？')) {
        timelineItems.value.splice(index, 1)
    }
}

// 编辑项目
const editItem = (index) => {
    editingIndex.value = index
}

// 取消编辑
const cancelEdit = () => {
    editingIndex.value = null
}

// 保存时间轴
const saveTimeline = async () => {
    isSaving.value = true
    saveMessage.value = { show: false, text: '', isError: false }
    
    try {
        await profileStore.updateTimeline(timelineItems.value)
        
        saveMessage.value = {
            show: true,
            text: '时间轴保存成功！',
            isError: false
        }
        
        setTimeout(() => {
            emit('saved')
            emit('close')
        }, 1000)
    } catch (error) {
        saveMessage.value = {
            show: true,
            text: '保存失败: ' + (error.message || '未知错误'),
            isError: true
        }
    } finally {
        isSaving.value = false
    }
}

// 取消
const cancel = () => {
    emit('close')
}

// 上移
const moveUp = (index) => {
    if (index > 0) {
        const temp = timelineItems.value[index]
        timelineItems.value[index] = timelineItems.value[index - 1]
        timelineItems.value[index - 1] = temp
    }
}

// 下移
const moveDown = (index) => {
    if (index < timelineItems.value.length - 1) {
        const temp = timelineItems.value[index]
        timelineItems.value[index] = timelineItems.value[index + 1]
        timelineItems.value[index + 1] = temp
    }
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div class="bg-[var(--color-bg-primary)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] px-6 py-4 flex justify-between items-center z-10">
                    <h2 class="text-2xl font-bold">编辑时间轴</h2>
                <button @click="cancel" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6">
                <!-- 添加新项目表单 -->
                <div class="mb-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                    <h3 class="text-lg font-semibold mb-3">添加新时间轴项目</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input v-model="newItem.year" type="text" placeholder="年份 (例: 2023)"
                            class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        <input v-model="newItem.title" type="text" placeholder="标题"
                            class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                    </div>
                    <input v-model="newItem.company" type="text" placeholder="公司/机构" class="w-full mb-3 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                    <textarea v-model="newItem.description" placeholder="描述" rows="2"
                        class="w-full mb-3 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"></textarea>
                    <button @click="addItem" type="button"
                        class="px-4 py-2 bg-github-green text-white rounded-md hover:bg-green-600">
                        添加项目
                    </button>
                </div>

                <!-- 时间轴项目列表 -->
                <div class="space-y-4">
                    <div v-for="(item, index) in timelineItems" :key="index"
                        class="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
                        
                        <!-- 显示模式 -->
                        <div v-if="editingIndex !== index">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="px-2 py-1 text-sm bg-github-blue text-white rounded">{{ item.year }}</span>
                                        <h4 class="text-lg font-semibold">{{ item.title }}</h4>
                                    </div>
                                    <p class="text-sm text-github-gray mb-1">{{ item.company }}</p>
                                    <p class="text-sm">{{ item.description }}</p>
                                </div>
                                <div class="flex gap-1 ml-2">
                                    <button @click="moveUp(index)" :disabled="index === 0" type="button"
                                        class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <button @click="moveDown(index)" :disabled="index === timelineItems.length - 1" type="button"
                                        class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <button @click="editItem(index)" type="button"
                                        class="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="removeItem(index)" type="button"
                                        class="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 编辑模式 -->
                        <div v-else class="space-y-2">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input v-model="item.year" type="text" placeholder="年份"
                                    class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                                <input v-model="item.title" type="text" placeholder="标题"
                                    class="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                            </div>
                            <input v-model="item.company" type="text" placeholder="公司/机构"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                            <textarea v-model="item.description" placeholder="描述" rows="2"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"></textarea>
                            <div class="flex justify-end gap-2">
                                <button @click="cancelEdit" type="button"
                                    class="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                                    取消
                                </button>
                                <button @click="cancelEdit" type="button"
                                    class="px-3 py-1 text-sm bg-github-blue text-white rounded-md hover:bg-blue-700">
                                    完成
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 保存消息 -->
                <div v-if="saveMessage.show" class="mb-4 p-3 rounded-md" :class="saveMessage.isError ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'">
                    {{ saveMessage.text }}
                </div>

                <!-- 操作按钮 -->
                <div class="flex justify-end gap-3 pt-6 mt-6 border-t border-[var(--color-border)]">
                    <button @click="cancel" type="button"
                        class="px-6 py-2 border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        取消
                    </button>
                    <button @click="saveTimeline" :disabled="isSaving" type="button"
                        class="px-6 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {{ isSaving ? '保存中...' : '保存时间轴' }}
                    </button>
                </div>
            </div>
        </div>
        </div>
    </Teleport>
</template>
