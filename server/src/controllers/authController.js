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
    const { username, password } = req.body;

    // 检查请求体
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "请提供用户名和密码",
      });
    }

    // 查找用户并包含密码字段
    const user = await User.findOne({ username }).select("+password");

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

// @desc    修改密码
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 检查请求体
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "请提供当前密码和新密码",
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "新密码至少需要6个字符",
      });
    }

    // 获取用户（包含密码）
    const user = await User.findById(req.user.id).select("+password");

    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "当前密码不正确",
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 生成新 token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "密码修改成功",
      token,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    修改用户名
// @route   PUT /api/auth/username
// @access  Private
exports.updateUsername = async (req, res, next) => {
  try {
    const { newUsername, password } = req.body;

    // 检查请求体
    if (!newUsername || !password) {
      return res.status(400).json({
        success: false,
        message: "请提供新用户名和密码",
      });
    }

    // 验证用户名长度
    if (newUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: "用户名至少需要3个字符",
      });
    }

    // 获取用户（包含密码）
    const user = await User.findById(req.user.id).select("+password");

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "密码不正确",
      });
    }

    // 检查用户名是否已被使用
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "该用户名已被使用",
      });
    }

    // 更新用户名
    user.username = newUsername;
    await user.save();

    // 生成新 token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "用户名修改成功",
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
