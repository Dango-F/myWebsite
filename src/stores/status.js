import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatusStore = defineStore('status', () => {
    // 预设的表情符号列表
    const emojiList = [
        { emoji: '😊', name: '微笑' },
        { emoji: '😂', name: '笑哭' },
        { emoji: '😎', name: '酷' },
        { emoji: '🤔', name: '思考' },
        { emoji: '😴', name: '睡觉' },
        { emoji: '😭', name: '哭泣' },
        { emoji: '🥳', name: '庆祝' },
        { emoji: '😷', name: '生病' },
        { emoji: '👨‍💻', name: '编程' },
        { emoji: '🎮', name: '游戏' },
        { emoji: '📚', name: '阅读' },
        { emoji: '🍜', name: '吃饭' },
        { emoji: '☕', name: '喝咖啡' },
        { emoji: '🏃', name: '跑步' },
        { emoji: '💼', name: '工作' },
        { emoji: '🎧', name: '听音乐' }
    ]

    // 保留该 store 作为本地缓存方案的备选实现。
    // 当前页面实际读写的是 Profile（后端持久化）。

    // 保存在本地存储中的键名
    const STORAGE_KEY = 'user_status'

    // 获取本地存储中的状态，如果没有则使用默认值
    const getStoredStatus = () => {
        // 处理服务器端渲染情况
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return { text: '正在编码...', emoji: '👨‍💻' }
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                return JSON.parse(stored)
            } catch (e) {
                console.error('解析状态数据失败:', e)
            }
        }
        return { text: '正在编码...', emoji: '👨‍💻' }
    }

    // 状态引用
    const status = ref(getStoredStatus())

    // 更新状态
    const updateStatus = (newStatus) => {
        status.value = { ...newStatus }
        // 保存到本地存储（当前未被组件使用）
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(status.value))
        }
    }

    // 设置状态文本
    const setStatusText = (text) => {
        updateStatus({ ...status.value, text })
    }

    // 设置状态表情
    const setStatusEmoji = (emoji) => {
        updateStatus({ ...status.value, emoji })
    }

    return {
        status,
        emojiList,
        updateStatus,
        setStatusText,
        setStatusEmoji
    }
}) 
