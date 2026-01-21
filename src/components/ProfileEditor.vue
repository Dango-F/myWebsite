<script setup>
import { ref, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { validateProfileData } from '@/utils/validators'

const profileStore = useProfileStore()
const emit = defineEmits(['close', 'saved'])

// 编辑表单数据
const formData = ref({
    name: '',
    avatar: '',
    bio: '',
    location: '',
    email: '',
    github: '',
    qq: '',
    wechat: '',
    website: '',
    company: '',
    position: '',
    github_username: '',
    skills: []
})

const newSkill = ref('')
const isSaving = ref(false)
const saveMessage = ref({ show: false, text: '', isError: false })
const dragIndex = ref(null)

// 初始化表单数据
onMounted(() => {
    formData.value = {
        name: profileStore.profile.name,
        avatar: profileStore.profile.avatar,
        bio: profileStore.profile.bio,
        location: profileStore.profile.location,
        email: profileStore.profile.email,
        github: profileStore.profile.github,
        qq: profileStore.profile.qq,
        wechat: profileStore.profile.wechat,
        website: profileStore.profile.website,
        company: profileStore.profile.company,
        position: profileStore.profile.position,
        github_username: profileStore.profile.github_username,
        skills: [...profileStore.profile.skills]
    }
})

// 添加技能
const addSkill = () => {
    if (newSkill.value.trim() && !formData.value.skills.includes(newSkill.value.trim())) {
        formData.value.skills.push(newSkill.value.trim())
        newSkill.value = ''
    }
}

// 删除技能
const removeSkill = (index) => {
    formData.value.skills.splice(index, 1)
}

const moveSkill = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    const skills = formData.value.skills
    const [moved] = skills.splice(fromIndex, 1)
    skills.splice(toIndex, 0, moved)
}

const onDragStart = (event, index) => {
    dragIndex.value = index
    if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
    }
}

const onDrop = (index) => {
    if (dragIndex.value === null) return
    moveSkill(dragIndex.value, index)
    dragIndex.value = null
}

const onDragEnd = () => {
    dragIndex.value = null
}

// 保存更改
const saveProfile = async () => {
    isSaving.value = true
    saveMessage.value = { show: false, text: '', isError: false }
    
    // 前端验证
    const validation = validateProfileData(formData.value)
    if (!validation.valid) {
        saveMessage.value = {
            show: true,
            text: validation.errors.join('；'),
            isError: true
        }
        isSaving.value = false
        return
    }
    
    try {
        await profileStore.updateProfile(formData.value)
        
        saveMessage.value = {
            show: true,
            text: '个人信息保存成功！',
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

// 取消编辑
const cancel = () => {
    emit('close')
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div class="bg-[var(--color-bg-primary)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] px-6 py-4 flex justify-between items-center z-10">
                    <h2 class="text-2xl font-bold">编辑个人资料</h2>
                <button @click="cancel" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6">
                <form @submit.prevent="saveProfile" class="space-y-6">
                    <!-- 基本信息 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">姓名</label>
                            <input v-model="formData.name" type="text" required
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">邮箱</label>
                            <input v-model="formData.email" type="email" required
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                    </div>

                    <!-- 头像 -->
                    <div>
                        <label class="block text-sm font-medium mb-2">头像链接</label>
                        <input v-model="formData.avatar" type="url"
                            class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        <div v-if="formData.avatar" class="mt-2">
                            <img :src="formData.avatar" alt="头像预览" class="w-20 h-20 rounded-full object-cover" />
                        </div>
                    </div>

                    <!-- 个人简介 -->
                    <div>
                        <label class="block text-sm font-medium mb-2">个人简介</label>
                        <textarea v-model="formData.bio" rows="3"
                            class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"></textarea>
                    </div>

                    <!-- 位置和公司 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">所在地</label>
                            <input v-model="formData.location" type="text"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">公司/学校</label>
                            <input v-model="formData.company" type="text"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                    </div>

                    <!-- 职位 -->
                    <div>
                        <label class="block text-sm font-medium mb-2">职位/专业</label>
                        <input v-model="formData.position" type="text"
                            class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                    </div>

                    <!-- 联系方式 -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">QQ</label>
                            <input v-model="formData.qq" type="text"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">微信</label>
                            <input v-model="formData.wechat" type="text"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">GitHub用户名</label>
                            <input v-model="formData.github_username" type="text"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                    </div>

                    <!-- 链接 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">GitHub链接</label>
                            <input v-model="formData.github" type="url"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">个人网站</label>
                            <input v-model="formData.website" type="url"
                                class="w-full p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                        </div>
                    </div>

                    <!-- 技能标签 -->
                    <div>
                        <label class="block text-sm font-medium mb-2">技能标签</label>
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span v-for="(skill, index) in formData.skills" :key="index"
                                class="px-3 py-1 text-sm rounded-full bg-blue-100 text-github-blue dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer select-none"
                                :class="dragIndex === index ? 'opacity-60' : ''"
                                draggable="true"
                                @dragstart="onDragStart($event, index)"
                                @dragover.prevent
                                @drop="onDrop(index)"
                                @dragend="onDragEnd">
                                {{ skill }}
                                <button type="button" @click="removeSkill(index)" class="text-red-500 hover:text-red-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <input v-model="newSkill" @keyup.enter="addSkill" type="text" placeholder="添加新技能..."
                                class="flex-1 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]" />
                            <button type="button" @click="addSkill"
                                class="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700">
                                添加
                            </button>
                        </div>
                    </div>

                    <!-- 保存消息 -->
                    <div v-if="saveMessage.show" class="p-3 rounded-md" :class="saveMessage.isError ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'">
                        {{ saveMessage.text }}
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                        <button type="button" @click="cancel"
                            class="px-6 py-2 border border-[var(--color-border)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                            取消
                        </button>
                        <button type="submit" :disabled="isSaving"
                            class="px-6 py-2 bg-github-blue text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {{ isSaving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    </Teleport>
</template>
