import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
    const profile = ref({
        name: 'YukiDango',
        // avatar: '/src/assets/images/avatar.jpg',
        avatar: 'https://avatars.githubusercontent.com/u/109727326?s=400&u=3a05d82d993d049bd7c03c5bdac0408eea8184f3&v=4',
        bio: '前端开发者 | AI 爱好者 | 开源贡献者',
        location: '安徽-宣城',
        email: '1847539781@qq.com',
        github: 'https://github.com/Dango-F',
        qq: '1847539781',
        wechat: 'fan15890094838',
        website: 'https://zhangsan.dev',
        company: 'HFUT',
        position: 'HFUT-CS-2022',
        skills: ['JavaScript', 'Vue', 'React', 'Node.js', 'TypeScript', 'CSS', 'HTML'],
        github_username: 'Dango-F'
    })

    const timeline = ref([
        {
            id: 1,
            year: '2023',
            title: '高级前端工程师',
            company: 'ABC科技有限公司',
            description: '负责公司核心产品的前端架构设计和团队管理。'
        },
        {
            id: 2,
            year: '2021',
            title: '前端工程师',
            company: 'XYZ互联网公司',
            description: '参与多个大型Web应用的开发，专注于性能优化和用户体验提升。'
        },
        {
            id: 3,
            year: '2020',
            title: '前端开发实习生',
            company: '创新科技初创公司',
            description: '参与公司产品原型设计和前端开发，学习前端技术栈。'
        },
        {
            id: 4,
            year: '2019',
            title: '计算机科学学士学位',
            company: '某知名大学',
            description: '主修计算机科学，辅修数学。GPA 3.8/4.0'
        }
    ])

    return { profile, timeline }
}) 