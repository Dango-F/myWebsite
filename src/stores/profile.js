import { defineStore } from 'pinia'
import { ref } from 'vue'
import profileService from '@/services/profileService'

export const useProfileStore = defineStore('profile', () => {
    const profile = ref({
        name: 'YukiDango',
        avatar: 'https://avatars.githubusercontent.com/u/109727326?s=400&u=3a05d82d993d049bd7c03c5bdac0408eea8184f3&v=4',
        bio: '空间智能 | 具身智能',
        location: '北京-怀柔',
        email: '1847539781@qq.com',
        github: 'https://github.com/Dango-F',
        qq: '1847539781',
        wechat: 'fan15890094838',
        website: 'https://zhangsan.dev',
        company: '中国科学院大学',
        position: 'UCAS-ES-计算机应用技术',
        status: {
            text: '正在编码...',
            emoji: '💻'
        },
        skills: ['JavaScript', 'Vue', 'React', 'Node.js', 'TypeScript', 'CSS', 'HTML'],
        github_username: 'Dango-F'
    })

    const timeline = ref([
        {
            year: '2023',
            title: '高级前端工程师',
            company: 'ABC科技有限公司',
            description: '负责公司核心产品的前端架构设计和团队管理。'
        },
        {
            year: '2021',
            title: '前端工程师',
            company: 'XYZ互联网公司',
            description: '参与多个大型Web应用的开发，专注于性能优化和用户体验提升。'
        },
        {
            year: '2020',
            title: '前端开发实习生',
            company: '创新科技初创公司',
            description: '参与公司产品原型设计和前端开发，学习前端技术栈。'
        },
        {
            year: '2019',
            title: '计算机科学学士学位',
            company: '某知名大学',
            description: '主修计算机科学，辅修数学。GPA 3.8/4.0'
        }
    ])

    const isLoading = ref(false)
    const error = ref(null)

    // 从服务器获取配置文件
    const fetchProfile = async () => {
        isLoading.value = true
        error.value = null
        try {
            const data = await profileService.getProfile()
            profile.value = {
                name: data.name,
                avatar: data.avatar,
                bio: data.bio,
                location: data.location,
                email: data.email,
                github: data.github,
                qq: data.qq,
                wechat: data.wechat,
                website: data.website,
                company: data.company,
                position: data.position,
                status: data.status || { text: '正在编码...', emoji: '💻' },
                skills: data.skills,
                github_username: data.github_username
            }
            timeline.value = data.timeline || []
        } catch (err) {
            error.value = '获取配置文件失败'
            console.error(err)
        } finally {
            isLoading.value = false
        }
    }

    // 更新配置文件
    const updateProfile = async (profileData) => {
        isLoading.value = true
        error.value = null
        try {
            const data = await profileService.updateProfile(profileData)
            profile.value = {
                name: data.name,
                avatar: data.avatar,
                bio: data.bio,
                location: data.location,
                email: data.email,
                github: data.github,
                qq: data.qq,
                wechat: data.wechat,
                website: data.website,
                company: data.company,
                position: data.position,
                status: data.status || { text: '正在编码...', emoji: '💻' },
                skills: data.skills,
                github_username: data.github_username
            }
            return data
        } catch (err) {
            error.value = '更新配置文件失败'
            console.error(err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 更新时间轴
    const updateTimeline = async (newTimeline) => {
        isLoading.value = true
        error.value = null
        try {
            const data = await profileService.updateTimeline(newTimeline)
            timeline.value = data.timeline || []
            return data
        } catch (err) {
            error.value = '更新时间轴失败'
            console.error(err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 更新技能列表
    const updateSkills = async (newSkills) => {
        isLoading.value = true
        error.value = null
        try {
            const data = await profileService.updateSkills(newSkills)
            profile.value.skills = data.skills
            return data
        } catch (err) {
            error.value = '更新技能列表失败'
            console.error(err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 重置配置文件
    const resetProfile = async () => {
        isLoading.value = true
        error.value = null
        try {
            const data = await profileService.resetProfile()
            profile.value = {
                name: data.name,
                avatar: data.avatar,
                bio: data.bio,
                location: data.location,
                email: data.email,
                github: data.github,
                qq: data.qq,
                wechat: data.wechat,
                website: data.website,
                company: data.company,
                position: data.position,
                status: data.status || { text: '正在编码...', emoji: '💻' },
                skills: data.skills,
                github_username: data.github_username
            }
            timeline.value = data.timeline || []
            return data
        } catch (err) {
            error.value = '重置配置文件失败'
            console.error(err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return { 
        profile, 
        timeline, 
        isLoading, 
        error,
        fetchProfile,
        updateProfile,
        updateTimeline,
        updateSkills,
        resetProfile
    }
}) 
