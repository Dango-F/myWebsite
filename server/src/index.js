const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// 路由导入
const postRoutes = require("./routes/posts");
const categoryRoutes = require("./routes/categories");
const tagRoutes = require("./routes/tags");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const todoRoutes = require("./routes/todos");
const configRoutes = require("./routes/config");

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置静态文件夹，用于存储上传的图片等文件
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 使用路由
app.use("/api/posts", postRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/config", configRoutes);

// 连接到数据库
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("数据库连接成功");
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("数据库连接失败:", error);
  });

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "服务器内部错误",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
