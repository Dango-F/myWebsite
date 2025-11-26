import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const profileService = {
    // 获取用户配置文件
    async getProfile() {
        const response = await axios.get(`${API_URL}/profile`)
        return response.data.data
    },

    // 更新用户配置文件
    async updateProfile(profileData) {
        const response = await axios.put(`${API_URL}/profile`, profileData)
        return response.data.data
    },

    // 更新时间轴
    async updateTimeline(timeline) {
        const response = await axios.put(`${API_URL}/profile/timeline`, { timeline })
        return response.data.data
    },

    // 更新技能列表
    async updateSkills(skills) {
        const response = await axios.put(`${API_URL}/profile/skills`, { skills })
        return response.data.data
    },

    // 重置配置文件
    async resetProfile() {
        const response = await axios.post(`${API_URL}/profile/reset`)
        return response.data.data
    }
}

export default profileService
