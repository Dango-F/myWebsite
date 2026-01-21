const Profile = require("../models/Profile");
const { sanitizeProfileData, sanitizeTimelineData } = require("../utils/sanitize");

// @desc    获取用户配置文件
// @route   GET /api/profile
// @access  Public
exports.getProfile = async (req, res, next) => {
    try {
        const userId = "default";

        let profile = await Profile.findOne({ user_id: userId });

        if (!profile) {
            // 如果不存在，创建默认配置文件
            profile = new Profile({ user_id: userId });
            await profile.save();
        }

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "获取配置文件失败",
            error: err.message,
        });
    }
};

// @desc    更新用户配置文件
// @route   PUT /api/profile
// @access  Public
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = "default";
        
        // 验证和清理输入数据
        const updates = sanitizeProfileData(req.body);

        let profile = await Profile.findOne({ user_id: userId });

        if (!profile) {
            // 如果不存在，创建新的配置文件
            profile = new Profile({ user_id: userId, ...updates });
            await profile.save();
        } else {
            // 更新现有配置文件
            profile = await Profile.findOneAndUpdate(
                { user_id: userId },
                updates,
                { new: true, runValidators: true }
            );
        }

        res.status(200).json({
            success: true,
            data: profile,
            message: "配置文件更新成功",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "更新配置文件失败",
            error: err.message,
        });
    }
};

// @desc    更新时间轴
// @route   PUT /api/profile/timeline
// @access  Public
exports.updateTimeline = async (req, res, next) => {
    try {
        const userId = "default";
        const { timeline } = req.body;

        if (!timeline || !Array.isArray(timeline)) {
            return res.status(400).json({
                success: false,
                message: "时间轴数据格式不正确",
            });
        }
        
        // 验证和清理时间轴数据
        const sanitizedTimeline = sanitizeTimelineData(timeline);

        let profile = await Profile.findOne({ user_id: userId });

        if (!profile) {
            profile = new Profile({ user_id: userId, timeline: sanitizedTimeline });
            await profile.save();
        } else {
            profile.timeline = sanitizedTimeline;
            await profile.save();
        }

        res.status(200).json({
            success: true,
            data: profile,
            message: "时间轴更新成功",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "更新时间轴失败",
            error: err.message,
        });
    }
};

// @desc    更新技能列表
// @route   PUT /api/profile/skills
// @access  Public
exports.updateSkills = async (req, res, next) => {
    try {
        const userId = "default";
        const { skills } = req.body;

        if (!skills || !Array.isArray(skills)) {
            return res.status(400).json({
                success: false,
                message: "技能列表格式不正确",
            });
        }

        let profile = await Profile.findOne({ user_id: userId });

        if (!profile) {
            profile = new Profile({ user_id: userId, skills });
            await profile.save();
        } else {
            profile.skills = skills;
            await profile.save();
        }

        res.status(200).json({
            success: true,
            data: profile,
            message: "技能列表更新成功",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "更新技能列表失败",
            error: err.message,
        });
    }
};

// @desc    重置配置文件到默认值
// @route   POST /api/profile/reset
// @access  Public
exports.resetProfile = async (req, res, next) => {
    try {
        const userId = "default";

        // 删除现有配置
        await Profile.findOneAndDelete({ user_id: userId });

        // 创建新的默认配置
        const profile = new Profile({ user_id: userId });
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile,
            message: "配置文件已重置为默认值",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "重置配置文件失败",
            error: err.message,
        });
    }
};
