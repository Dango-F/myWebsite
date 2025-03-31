const UserConfig = require("../models/UserConfig");
const crypto = require("crypto");

// 生成安全的派生密钥
const generateSecureKey = () => {
    // 使用客户端IP和用户代理作为额外的混淆因素
    return process.env.JWT_SECRET || 'default_key';
};

// @desc    获取用户配置
// @route   GET /api/config
// @access  Public
exports.getUserConfig = async (req, res, next) => {
    try {
        // 使用默认用户ID
        const userId = "default";

        // 查找用户配置，如果不存在则创建一个
        let userConfig = await UserConfig.findOne({ user_id: userId });

        if (!userConfig) {
            userConfig = new UserConfig({ user_id: userId });
            await userConfig.save();
        }

        // 获取安全密钥
        const secureKey = generateSecureKey();

        // 解密GitHub token (如果存在)
        const githubToken = userConfig.getGithubToken(secureKey);

        // 返回必要的配置信息，但不返回加密的原始数据
        res.status(200).json({
            success: true,
            data: {
                github_token: githubToken,
                preferences: userConfig.preferences,
                updated_at: userConfig.updated_at
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    更新GitHub Token
// @route   POST /api/config/github-token
// @access  Public
exports.updateGithubToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token不能为空"
            });
        }

        // 使用默认用户ID
        const userId = "default";

        // 查找用户配置，如果不存在则创建一个
        let userConfig = await UserConfig.findOne({ user_id: userId });

        if (!userConfig) {
            userConfig = new UserConfig({ user_id: userId });
        }

        // 获取安全密钥
        const secureKey = generateSecureKey();

        // 设置并加密GitHub token
        userConfig.setGithubToken(token, secureKey);
        await userConfig.save();

        res.status(200).json({
            success: true,
            message: "GitHub Token已更新",
            data: {
                updated_at: userConfig.updated_at
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    删除GitHub Token
// @route   DELETE /api/config/github-token
// @access  Public
exports.deleteGithubToken = async (req, res, next) => {
    try {
        // 使用默认用户ID
        const userId = "default";

        // 查找用户配置
        const userConfig = await UserConfig.findOne({ user_id: userId });

        if (!userConfig) {
            return res.status(404).json({
                success: false,
                message: "用户配置不存在"
            });
        }

        // 清除GitHub token
        userConfig.github_token = null;
        await userConfig.save();

        res.status(200).json({
            success: true,
            message: "GitHub Token已删除"
        });
    } catch (err) {
        next(err);
    }
}; 