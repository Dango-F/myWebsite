const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const markdown = require("markdown-it")();
const multer = require("multer");

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;

    // 根据文件类型选择不同的目录
    if (file.mimetype.startsWith("image/")) {
      uploadDir = path.join(__dirname, "../../uploads/images");
    } else if (
      file.mimetype === "text/markdown" ||
      file.originalname.endsWith(".md")
    ) {
      uploadDir = path.join(__dirname, "../../uploads/markdown");
    } else {
      uploadDir = path.join(__dirname, "../../uploads/others");
    }

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${name}-${timestamp}${ext}`);
  },
});

// 创建上传中间件
exports.upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
  fileFilter: function (req, file, cb) {
    // 接受的文件类型
    const fileTypes = /jpeg|jpg|png|gif|webp|svg|md|markdown|txt/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype =
      fileTypes.test(file.mimetype) ||
      file.mimetype === "text/markdown" ||
      file.originalname.endsWith(".md");

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("不支持的文件类型！"));
    }
  },
}).single("file");

// 批量上传
exports.uploadMultiple = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // 只接受 markdown 文件用于批量上传
    if (
      file.mimetype === "text/markdown" ||
      file.originalname.endsWith(".md")
    ) {
      return cb(null, true);
    }
    cb(new Error("批量上传只支持 Markdown 文件！"));
  },
}).array("files", 20); // 最多20个文件

// @desc    管理面板 - 统计信息
// @route   GET /api/admin/stats
// @access  Public
exports.getStats = async (req, res, next) => {
  try {
    const postsCount = await Post.countDocuments();
    const categoriesCount = await Category.countDocuments();
    const tagsCount = await Tag.countDocuments();

    // 最近的5篇文章
    const recentPosts = await Post.find()
      .sort("-createdAt")
      .limit(5)
      .populate("category", "name")
      .select("title slug status createdAt");

    res.status(200).json({
      success: true,
      data: {
        counts: {
          posts: postsCount,
          categories: categoriesCount,
          tags: tagsCount,
        },
        recentPosts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    上传图片
// @route   POST /api/admin/upload-image
// @access  Public
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "请选择要上传的图片",
      });
    }

    // 返回文件的URL
    const fileUrl = `/uploads/images/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    上传并创建 Markdown 博客
// @route   POST /api/admin/upload-post
// @access  Public
exports.uploadPost = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "请上传 Markdown 文件",
      });
    }

    // 读取 Markdown 文件内容
    const fileContent = fs.readFileSync(req.file.path, "utf8");

    // 从 Markdown 提取标题（第一个 # 开头的行）
    const titleMatch = fileContent.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : path.basename(req.file.originalname, ".md");

    // 渲染 HTML
    const htmlContent = markdown.render(fileContent);

    // 获取分类和标签信息
    const { category = "未分类", tags = "", status = "published" } = req.body;

    // 查找或创建分类
    let categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      categoryDoc = await Category.create({ name: category });
    }

    // 处理标签
    const tagNames = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const tagIds = [];

    for (const tagName of tagNames) {
      let tagDoc = await Tag.findOne({ name: tagName });
      if (!tagDoc) {
        tagDoc = await Tag.create({ name: tagName });
      }
      tagIds.push(tagDoc._id);
    }

    // 创建博客文章
    const post = await Post.create({
      title,
      content: fileContent,
      html_content: htmlContent,
      category: categoryDoc._id,
      tags: tagIds,
      status,
      author: new mongoose.Types.ObjectId("000000000000000000000000"), // 默认作者ID
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    // 清理上传的文件
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    next(err);
  }
};

// @desc    批量上传博客文章
// @route   POST /api/admin/upload-posts-batch
// @access  Public
exports.uploadPostsBatch = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "请上传至少一个 Markdown 文件",
      });
    }

    // 获取公共的分类和标签
    const { category = "未分类", tags = "", status = "published" } = req.body;

    // 查找或创建分类
    let categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      categoryDoc = await Category.create({ name: category });
    }

    // 处理标签
    const tagNames = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const tagIds = [];

    for (const tagName of tagNames) {
      let tagDoc = await Tag.findOne({ name: tagName });
      if (!tagDoc) {
        tagDoc = await Tag.create({ name: tagName });
      }
      tagIds.push(tagDoc._id);
    }

    const results = {
      success: [],
      failed: [],
    };

    // 处理每个文件
    for (const file of req.files) {
      try {
        // 读取文件内容
        const fileContent = fs.readFileSync(file.path, "utf8");

        // 提取标题
        const titleMatch = fileContent.match(/^#\s+(.+)$/m);
        const title = titleMatch
          ? titleMatch[1].trim()
          : path.basename(file.originalname, ".md");

        // 渲染 HTML
        const htmlContent = markdown.render(fileContent);

        // 创建博客文章
        const post = await Post.create({
          title,
          content: fileContent,
          html_content: htmlContent,
          category: categoryDoc._id,
          tags: tagIds,
          status,
          author: new mongoose.Types.ObjectId("000000000000000000000000"), // 默认作者ID
        });

        results.success.push({
          filename: file.originalname,
          id: post._id,
          title: post.title,
        });
      } catch (error) {
        results.failed.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        total: req.files.length,
        successful: results.success.length,
        failed: results.failed.length,
        details: results,
      },
    });
  } catch (err) {
    // 清理上传的文件
    if (req.files) {
      req.files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    next(err);
  }
};

// @desc    获取所有博客文章（管理列表）
// @route   GET /api/admin/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;

    // 构建查询条件
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [{ name: category }, { slug: category }],
      });

      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // 搜索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // 执行分页查询
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: "category", select: "name slug" },
        { path: "tags", select: "name slug" },
      ],
    };

    const posts = await Post.paginate(query, options);

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    更新博客文章状态（发布/下架）
// @route   PUT /api/admin/posts/:id/status
// @access  Public
exports.updatePostStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !["published", "draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "无效的状态值",
      });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "找不到博客文章",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    删除博客文章
// @route   DELETE /api/admin/posts/:id
// @access  Public
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "找不到博客文章",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
