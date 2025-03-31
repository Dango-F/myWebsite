const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 保护路由
exports.protect = async (req, res, next) => {
  let token;

  // 从请求头获取 token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 确保 token 存在
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "未授权访问",
    });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 设置当前用户
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "未授权访问",
    });
  }
};

// 授权角色
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "未授权访问",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "无权执行此操作",
      });
    }

    next();
  };
};
