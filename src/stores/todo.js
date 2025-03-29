import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTodoStore = defineStore('todo', () => {
    const todos = ref(JSON.parse(localStorage.getItem('todos')) || [
        { id: 1, text: '完成GitHub风格博客', completed: false, priority: 'high', category: '工作' },
        { id: 2, text: '学习Vue 3新特性', completed: true, priority: 'medium', category: '学习' },
        { id: 3, text: '阅读技术文档', completed: false, priority: 'low', category: '学习' }
    ])

    // 添加默认分类列表
    const defaultCategories = ['工作', '学习', '生活', '娱乐', '其他']

    const categories = computed(() => {
        const categorySet = new Set(defaultCategories)
        todos.value.forEach(todo => categorySet.add(todo.category))
        return [...categorySet]
    })

    const priorities = computed(() => ['high', 'medium', 'low'])

    const addTodo = (todo) => {
        const newId = todos.value.length ? Math.max(...todos.value.map(t => t.id)) + 1 : 1
        todos.value.push({
            id: newId,
            text: todo.text,
            completed: false,
            priority: todo.priority,
            category: todo.category
        })
        saveTodos()
    }

    const toggleTodo = (id) => {
        const todo = todos.value.find(todo => todo.id === id)
        if (todo) {
            todo.completed = !todo.completed
            saveTodos()
        }
    }

    const removeTodo = (id) => {
        const index = todos.value.findIndex(todo => todo.id === id)
        if (index !== -1) {
            todos.value.splice(index, 1)
            saveTodos()
        }
    }

    const updateTodo = (id, updates) => {
        const todo = todos.value.find(todo => todo.id === id)
        if (todo) {
            Object.assign(todo, updates)
            saveTodos()
        }
    }

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos.value))
    }

    return {
        todos,
        categories,
        priorities,
        addTodo,
        toggleTodo,
        removeTodo,
        updateTodo
    }
}) 