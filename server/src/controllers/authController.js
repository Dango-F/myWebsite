const User = require("../models/User");
const jwt = require("jsonwebtoken");

// 生成 JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    注册用户
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
    });

    // 创建 token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    // 处理重复键错误
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `${field === "email" ? "邮箱" : "用户名"}已被注册`;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    next(err);
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 检查请求体
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "请提供邮箱和密码",
      });
    }

    // 查找用户并包含密码字段
    const user = await User.findOne({ email }).select("+password");

    // 检查用户是否存在
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "无效的凭证",
      });
    }

    // 检查密码是否匹配
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "无效的凭证",
      });
    }

    // 创建 token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取当前用户
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
