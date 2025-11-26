const mongoose = require("mongoose");

const TimelineItemSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
});

const ProfileSchema = new mongoose.Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true,
            default: "default",
        },
        name: {
            type: String,
            required: true,
            default: "YukiDango",
        },
        avatar: {
            type: String,
            default: "https://avatars.githubusercontent.com/u/109727326?s=400&u=3a05d82d993d049bd7c03c5bdac0408eea8184f3&v=4",
        },
        bio: {
            type: String,
            default: "前端开发者 | AI 爱好者 | 开源贡献者",
        },
        location: {
            type: String,
            default: "安徽-宣城",
        },
        email: {
            type: String,
            required: true,
            default: "1847539781@qq.com",
        },
        github: {
            type: String,
            default: "https://github.com/Dango-F",
        },
        qq: {
            type: String,
            default: "1847539781",
        },
        wechat: {
            type: String,
            default: "fan15890094838",
        },
        website: {
            type: String,
            default: "https://zhangsan.dev",
        },
        company: {
            type: String,
            default: "HFUT",
        },
        position: {
            type: String,
            default: "HFUT-CS-2022",
        },
        skills: {
            type: [String],
            default: ["JavaScript", "Vue", "React", "Node.js", "TypeScript", "CSS", "HTML"],
        },
        github_username: {
            type: String,
            default: "Dango-F",
        },
        timeline: {
            type: [TimelineItemSchema],
            default: [
                {
                    year: "2023",
                    title: "高级前端工程师",
                    company: "ABC科技有限公司",
                    description: "负责公司核心产品的前端架构设计和团队管理。",
                },
                {
                    year: "2021",
                    title: "前端工程师",
                    company: "XYZ互联网公司",
                    description: "参与多个大型Web应用的开发，专注于性能优化和用户体验提升。",
                },
                {
                    year: "2020",
                    title: "前端开发实习生",
                    company: "创新科技初创公司",
                    description: "参与公司产品原型设计和前端开发，学习前端技术栈。",
                },
                {
                    year: "2019",
                    title: "计算机科学学士学位",
                    company: "某知名大学",
                    description: "主修计算机科学，辅修数学。GPA 3.8/4.0",
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Profile", ProfileSchema);
