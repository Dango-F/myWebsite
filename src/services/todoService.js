import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const todoService = {
    // 获取所有待办事项
    async getAllTodos() {
        try {
            const response = await axios.get(`${API_URL}/todos`);
            return response.data.data;
        } catch (error) {
            console.error('获取待办事项失败:', error);
            throw error;
        }
    },

    // 创建新的待办事项
    async createTodo(todoData) {
        try {
            const response = await axios.post(`${API_URL}/todos`, todoData);
            return response.data.data;
        } catch (error) {
            console.error('创建待办事项失败:', error);
            throw error;
        }
    },

    // 更新待办事项
    async updateTodo(id, todoData) {
        try {
            const response = await axios.put(`${API_URL}/todos/${id}`, todoData);
            return response.data.data;
        } catch (error) {
            console.error('更新待办事项失败:', error);
            throw error;
        }
    },

    // 删除待办事项
    async deleteTodo(id) {
        try {
            const response = await axios.delete(`${API_URL}/todos/${id}`);
            return response.data;
        } catch (error) {
            console.error('删除待办事项失败:', error);
            throw error;
        }
    },

    // 切换待办事项完成状态
    async toggleTodoComplete(id, completed) {
        try {
            const response = await axios.put(`${API_URL}/todos/${id}`, { completed });
            return response.data.data;
        } catch (error) {
            console.error('切换待办事项状态失败:', error);
            throw error;
        }
    }
};

export default todoService; 