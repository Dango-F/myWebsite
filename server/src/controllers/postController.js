const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const markdown = require("markdown-it")();
const multer = require("multer");
const slugify = require("slugify");

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: function (req, file, cb) {
    // 接受 markdown 和图片文件
    if (
      file.mimetype === "text/markdown" ||
      file.originalname.endsWith(".md") ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("只接受 Markdown 和图片文件!"), false);
    }
  },
}).single("file");

// @desc    获取所有文章
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    let query;

    // 复制 req.query
    const reqQuery = { ...req.query };

    // 要排除的字段
    const removeFields = ["select", "sort", "page", "limit", "populate"];
    removeFields.forEach((param) => delete reqQuery[param]);

    // 创建查询字符串
    let queryStr = JSON.stringify(reqQuery);

    // 创建操作符 ($gt, $gte, 等)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // 查找文章
    query = Post.find(JSON.parse(queryStr));

    // 总是填充分类和标签，确保返回完整信息
    query = query.populate("category", "name slug");
    query = query.populate("tags", "name slug");

    // 只有当请求中包含populate=true时，填充作者信息
    if (req.query.populate === "true") {
      query = query.populate("author", "username");
    }

    // 如果指定了 status，确保只有管理员可以查看草稿
    if (
      reqQuery.status === "draft" &&
      (!req.user || req.user.role !== "admin")
    ) {
      query = query.find({ status: "published" });
    }

    // SELECT 字段
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // 排序
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // 分页
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Post.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // 执行查询
    const posts = await query;

    // 分页结果
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取单个文章
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    let post;

    // 支持通过 ID 或 slug 查找
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      post = await Post.findById(req.params.id);
    } else {
      post = await Post.findOne({ slug: req.params.id });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "找不到文章",
      });
    }

    // 如果是草稿状态，确保只有管理员可以查看
    if (post.status === "draft" && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({
        success: false,
        message: "无权访问",
      });
    }

    // 填充关联数据
    await post.populate("category", "name slug");
    await post.populate("tags", "name slug");
    await post.populate("author", "username");

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    创建文章
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    // 如果提供了 markdown 内容，生成 HTML
    if (req.body.content) {
      req.body.html_content = markdown.render(req.body.content);
    }

    // 确保当前用户是作者
    req.body.author = req.user.id;

    // 处理标签
    if (req.body.tags && Array.isArray(req.body.tags)) {
      const tagIds = [];

      for (const tagName of req.body.tags) {
        // 查找或创建标签
        let tag = await Tag.findOne({ name: tagName });

        if (!tag) {
          tag = await Tag.create({ name: tagName });
        }

        tagIds.push(tag._id);
      }

      req.body.tags = tagIds;
    }

    const post = await Post.create(req.body);

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    上传 Markdown 文件创建文章
// @route   POST /api/posts/upload
// @access  Private
exports.uploadMarkdown = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "请上传 Markdown 文件",
      });
    }

    // 读取上传的 Markdown 文件内容
    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, "utf8");

    // 从 Markdown 提取标题（第一个 # 标题）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : path.basename(req.file.originalname, ".md");

    // 创建 HTML 内容
    const html_content = markdown.render(content);

    // 获取其他表单数据
    const { category, tags, status } = req.body;

    // 确保分类存在
    let categoryId;
    if (category) {
      let categoryDoc = await Category.findOne({ name: category });

      if (!categoryDoc) {
        categoryDoc = await Category.create({ name: category });
      }

      categoryId = categoryDoc._id;
    } else {
      // 使用默认分类
      let defaultCategory = await Category.findOne({ name: "未分类" });

      if (!defaultCategory) {
        defaultCategory = await Category.create({ name: "未分类" });
      }

      categoryId = defaultCategory._id;
    }

    // 处理标签
    const tagIds = [];
    if (tags) {
      const tagNames = tags.split(",").map((tag) => tag.trim());

      for (const tagName of tagNames) {
        if (tagName) {
          let tag = await Tag.findOne({ name: tagName });

          if (!tag) {
            tag = await Tag.create({ name: tagName });
          }

          tagIds.push(tag._id);
        }
      }
    }

    // 创建文章
    const post = await Post.create({
      title,
      content,
      html_content,
      category: categoryId,
      tags: tagIds,
      status: status || "published",
      author: req.user.id,
    });

    // 删除临时文件
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    更新文章
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "找不到文章",
      });
    }

    // 确保用户是文章作者或管理员
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "无权修改该文章",
      });
    }

    // 如果提供了 markdown 内容，更新 HTML
    if (req.body.content) {
      req.body.html_content = markdown.render(req.body.content);
    }

    // 处理标签
    if (req.body.tags && Array.isArray(req.body.tags)) {
      const tagIds = [];

      for (const tagName of req.body.tags) {
        let tag = await Tag.findOne({ name: tagName });

        if (!tag) {
          tag = await Tag.create({ name: tagName });
        }

        tagIds.push(tag._id);
      }

      req.body.tags = tagIds;
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    删除文章
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "找不到文章",
      });
    }

    // 确保用户是文章作者或管理员
    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "无权删除该文章",
      });
    }

    // 查找并删除与此博客关联的文件
    const uploadsDir = path.join(__dirname, "../../uploads");
    let fileDeleted = false; // 跟踪是否删除了文件

    // 尝试遍历markdown目录寻找特定文章的文件
    const markdownDir = path.join(uploadsDir, "markdown");
    if (fs.existsSync(markdownDir)) {
      const files = fs.readdirSync(markdownDir);

      // 为文章生成唯一标识
      const postSlug = slugify(post.title, { lower: true });
      // 尝试获取文章文件名，通常上传时会保留
      const originalFileName = post.file_name || "";

      for (const file of files) {
        const filePath = path.join(markdownDir, file);

        try {
          // 读取文件内容
          const fileContent = fs.readFileSync(filePath, "utf8");

          // 文件匹配条件：
          // 1. 比较文件ID - 最准确的方式（如果文件名包含MongoDB ID）
          const fileContainsId = file.includes(post._id.toString());

          // 2. 比较原始文件名 - 如果保存了原始文件名
          const fileMatchesOriginalName =
            originalFileName && file === originalFileName;

          // 3. 比较标题和内容 - 作为后备方案
          const fileMatchesTitle = file.toLowerCase().includes(postSlug);
          const contentSample = post.content?.substring(0, 100) || "";
          const fileMatchesContent =
            contentSample && fileContent.includes(contentSample);

          // 只有在以下情况才删除文件:
          // - 文件名包含文章ID（最精确的匹配）
          // - 文件名与原始上传文件名匹配
          // - 在没有更好方法时：文件名包含标题slug且内容前100个字符匹配
          if (
            fileContainsId ||
            fileMatchesOriginalName ||
            (fileMatchesTitle && fileMatchesContent)
          ) {
            fs.unlinkSync(filePath);
            console.log(`已删除文件: ${filePath}`);
            fileDeleted = true;
            break; // 找到并删除了对应文件，不再继续查找
          }
        } catch (error) {
          console.error(`处理文件 ${filePath} 时出错:`, error);
          // 继续处理其他文件，不中断流程
        }
      }
    }

    // 删除与该文章相关的图片文件
    const imagesDir = path.join(uploadsDir, "images");
    if (fs.existsSync(imagesDir) && post.slug) {
      const files = fs.readdirSync(imagesDir);

      for (const file of files) {
        // 图片匹配条件更精确：必须包含文章ID或特定slug
        const fileContainsId = file.includes(post._id.toString());
        const fileMatchesSlug = post.slug && file.includes(post.slug);

        if (fileContainsId || fileMatchesSlug) {
          const filePath = path.join(imagesDir, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`已删除图片: ${filePath}`);
          } catch (error) {
            console.error(`删除图片 ${filePath} 时出错:`, error);
          }
        }
      }
    }

    // 删除数据库中的记录
    await post.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: fileDeleted
        ? "文章及其相关文件已成功删除"
        : "文章已从数据库中删除，但未找到关联文件",
    });
  } catch (err) {
    next(err);
  }
};
