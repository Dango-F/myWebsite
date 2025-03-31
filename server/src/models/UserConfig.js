const mongoose = require("mongoose");
const crypto = require("crypto");

// 加密函数
function encrypt(text, key) {
    if (!text) return null;

    try {
        // 使用环境变量中的JWT密钥作为加密密钥的一部分
        const envSecret = process.env.JWT_SECRET || 'default_secret_key';
        const derivedKey = crypto.scryptSync(envSecret + key, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // 将IV和加密数据一起存储
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('加密失败:', error);
        return null;
    }
}

// 解密函数
function decrypt(encryptedText, key) {
    if (!encryptedText) return null;

    try {
        const envSecret = process.env.JWT_SECRET || 'default_secret_key';
        const derivedKey = crypto.scryptSync(envSecret + key, 'salt', 32);

        // 分离IV和加密数据
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('解密失败:', error);
        return null;
    }
}

const UserConfigSchema = new mongoose.Schema(
    {
        // 使用user_id作为配置标识符
        user_id: {
            type: String,
            required: true,
            unique: true,
            default: "default"
        },
        // 存储加密的GitHub token
        github_token: {
            type: String,
            default: null
        },
        // 其他可能的配置
        preferences: {
            type: Object,
            default: {}
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    }
);

// 设置token时自动加密
UserConfigSchema.methods.setGithubToken = function (token, encryptionKey) {
    if (!token) {
        this.github_token = null;
        return;
    }

    this.github_token = encrypt(token, encryptionKey);
    this.updated_at = Date.now();
};

// 获取token时自动解密
UserConfigSchema.methods.getGithubToken = function (encryptionKey) {
    if (!this.github_token) return null;

    return decrypt(this.github_token, encryptionKey);
};

// 更新时自动设置更新时间
UserConfigSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model("UserConfig", UserConfigSchema); 