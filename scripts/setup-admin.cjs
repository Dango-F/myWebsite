const axios = require('axios');

// 配置
const API_URL = 'http://localhost:3000/api/auth';
const ADMIN_USER = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'password123'
};

const createAdmin = async () => {
    console.log('正在尝试创建管理员账号...');
    try {
        const response = await axios.post(`${API_URL}/register`, ADMIN_USER);
        if (response.data.success) {
            console.log('✅ 管理员账号创建成功！');
            console.log(`📧 邮箱: ${ADMIN_USER.email}`);
            console.log(`🔑 密码: ${ADMIN_USER.password}`);
            console.log('⚠️ 请务必登录系统后修改密码！');
        }
    } catch (error) {
        if (error.response && error.response.data) {
            console.error('❌ 创建失败:', error.response.data.message);
        } else {
            console.error('❌ 连接服务器失败，请确保后端服务器正在运行 (http://localhost:3000)');
        }
    }
};

createAdmin();
