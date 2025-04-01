const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const markdown = require("markdown-it")();
const multer = require("multer");
const slugify = require("slugify");

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
    // 文章总数
    const postsCount = await Post.countDocuments();

    // 获取实际使用的分类数量（只统计被文章使用的分类）
    const usedCategories = await Post.distinct("category");
    const categoriesCount = usedCategories.length;

    // 获取实际使用的标签数量（只统计被文章使用的标签）
    const usedTags = await Post.distinct("tags");
    const tagsCount = usedTags.length;

    // 获取实际使用的分类详细信息
    const allCategories = await Category.find({
      _id: { $in: usedCategories },
    })
      .select("name slug")
      .sort("name");

    // 获取实际使用的标签详细信息
    const allTags = await Tag.find({
      _id: { $in: usedTags },
    })
      .select("name slug")
      .sort("name");

    // 最近的5篇文章
    const recentPosts = await Post.find()
      .sort("-date")
      .limit(5)
      .populate("category", "name")
      .populate("tags", "name")
      .select("title slug status date createdAt category tags");

    res.status(200).json({
      success: true,
      data: {
        counts: {
          posts: postsCount,
          categories: categoriesCount,
          tags: tagsCount,
        },
        categories: allCategories,
        tags: allTags,
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
    const tagDocs = [];

    for (const tagName of tagNames) {
      let tagDoc = await Tag.findOne({ name: tagName });
      if (!tagDoc) {
        tagDoc = await Tag.create({ name: tagName });
      }
      tagIds.push(tagDoc._id);
      tagDocs.push(tagDoc);
    }

    // 生成slug
    const slug = slugify(title, { lower: true });

    // 保存原始文件名和文件上传路径
    const originalFileName = req.file.originalname;
    const filePath = req.file.path;

    // 重命名上传的文件，添加MongoDB ID前缀
    const newFileName = `${Date.now()}-${originalFileName}`;
    const newFilePath = path.join(path.dirname(filePath), newFileName);

    // 创建博客文章
    const post = await Post.create({
      title,
      content: fileContent,
      html_content: htmlContent,
      category: categoryDoc._id,
      tags: tagIds,
      status,
      slug,
      file_name: newFileName, // 保存新文件名（包含时间戳）
      original_file_name: originalFileName, // 保存原始文件名
      author: new mongoose.Types.ObjectId("000000000000000000000000"), // 默认作者ID
      date: new Date().toISOString(), // 确保文章日期是当前日期
      createdAt: new Date(), // 明确设置创建时间
    });

    // 重命名文件，添加MongoDB ID
    try {
      // 创建新的文件名，包含文章ID
      const idBasedFileName = `${post._id}-${originalFileName}`;
      const idBasedFilePath = path.join(
        path.dirname(filePath),
        idBasedFileName
      );

      // 重命名文件
      fs.renameSync(filePath, idBasedFilePath);

      // 更新文章记录中的文件名
      post.file_name = idBasedFileName;
      await post.save();
    } catch (e) {
      console.error("重命名文件失败:", e);
      // 如果重命名失败，不中断流程
    }

    // 构建包含完整分类和标签信息的响应
    const postResponse = post.toObject();

    // 替换分类ID为完整的分类对象
    postResponse.category = {
      _id: categoryDoc._id,
      name: categoryDoc.name,
      slug: categoryDoc.slug,
    };

    // 替换标签ID数组为完整的标签对象数组
    postResponse.tags = tagDocs.map((tag) => ({
      _id: tag._id,
      name: tag.name,
      slug: tag.slug,
    }));

    res.status(201).json({
      success: true,
      data: postResponse,
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

        // 生成slug
        const slug = slugify(title, { lower: true });

        // 保存原始文件名
        const originalFileName = file.originalname;

        // 创建博客文章
        const post = await Post.create({
          title,
          content: fileContent,
          html_content: htmlContent,
          category: categoryDoc._id,
          tags: tagIds,
          status,
          slug,
          file_name: originalFileName, // 临时使用原始文件名
          original_file_name: originalFileName, // 保存原始文件名
          author: new mongoose.Types.ObjectId("000000000000000000000000"), // 默认作者ID
          date: new Date().toISOString(), // 确保文章日期是当前日期
          createdAt: new Date(), // 明确设置创建时间
        });

        // 重命名文件，添加MongoDB ID
        try {
          // 创建新的文件名，包含文章ID
          const idBasedFileName = `${post._id}-${originalFileName}`;
          const idBasedFilePath = path.join(
            path.dirname(file.path),
            idBasedFileName
          );

          // 重命名文件
          fs.renameSync(file.path, idBasedFilePath);

          // 更新文章记录中的文件名
          post.file_name = idBasedFileName;
          await post.save();
        } catch (e) {
          console.error(`重命名文件 ${file.originalname} 失败:`, e);
          // 如果重命名失败，不中断流程
        }

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
      sort: { date: -1 }, // 优先按发布日期排序，而不是创建日期
      populate: [
        { path: "category", select: "name slug" },
        { path: "tags", select: "name slug" },
      ],
      select:
        "title content html_content status slug category tags date createdAt updatedAt file_name original_file_name author", // 确保包含date字段
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

    // 先获取文章
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "找不到博客文章",
      });
    }

    // 更新状态
    post.status = status;

    // 如果状态变为"已发布"，则更新发布日期
    if (status === "published") {
      const now = new Date();
      post.date = now;
      post.updatedAt = now;

      // 确保明确记录状态变更
      console.log(
        `博客状态更新：ID ${post._id}, 标题 "${
          post.title
        }", 状态改为 ${status}, 更新时间 ${now.toISOString()}, date字段: ${post.date.toISOString()}`
      );
    }

    // 保存更新
    await post.save();

    // 重新获取文章并填充关联信息，确保返回完整的文章对象
    const updatedPost = await Post.findById(post._id)
      .populate("category", "name slug")
      .populate("tags", "name slug");

    // 返回更新后的文章
    res.status(200).json({
      success: true,
      data: updatedPost,
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

// @desc    同步数据库和文件系统
// @route   POST /api/admin/sync-files
// @access  Public
exports.syncFiles = async (req, res, next) => {
  try {
    const result = {
      removed: [],
      checked: 0,
      errors: [],
    };

    // 获取所有文章
    const posts = await Post.find()
      .populate("category", "name")
      .populate("tags", "name");
    result.checked = posts.length;

    const uploadsDir = path.join(__dirname, "../../uploads");
    const markdownDir = path.join(uploadsDir, "markdown");

    // 确保目录存在
    if (!fs.existsSync(markdownDir)) {
      fs.mkdirSync(markdownDir, { recursive: true });
      return res.status(200).json({
        success: true,
        data: {
          message: "Markdown目录不存在，已创建新目录",
          result,
        },
      });
    }

    // 获取所有markdown文件
    const existingFiles = fs.readdirSync(markdownDir);
    const filesContent = {};

    // 缓存文件内容以避免重复读取
    for (const file of existingFiles) {
      try {
        const filePath = path.join(markdownDir, file);
        const stats = fs.statSync(filePath);

        // 只处理文件，跳过目录
        if (!stats.isFile()) continue;

        // 读取文件内容
        const content = fs.readFileSync(filePath, "utf8");
        filesContent[file] = content;
      } catch (error) {
        result.errors.push(`读取文件 ${file} 失败: ${error.message}`);
      }
    }

    // 检查每篇文章是否有对应文件
    for (const post of posts) {
      let fileFound = false;
      const postSlug = slugify(post.title, { lower: true });

      // 检查文件是否存在 - 通过内容或标题匹配
      for (const [fileName, content] of Object.entries(filesContent)) {
        // 文件名匹配标题的slug
        const fileMatchesTitle = fileName.toLowerCase().includes(postSlug);

        // 文章内容的前100个字符是否与文件内容匹配
        const fileMatchesContent =
          post.content && content.includes(post.content.substring(0, 100));

        if (fileMatchesTitle || fileMatchesContent) {
          fileFound = true;
          break;
        }
      }

      // 如果没有找到对应文件，删除数据库记录
      if (!fileFound) {
        // 记录将被删除的文章信息
        result.removed.push({
          id: post._id,
          title: post.title,
          category: post.category?.name || "未分类",
          tags: post.tags?.map((tag) => tag.name) || [],
          createdAt: post.createdAt,
        });

        // 删除数据库中的记录
        await Post.findByIdAndDelete(post._id);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: `同步完成。检查了${result.checked}篇文章，移除了${result.removed.length}篇没有对应文件的文章。`,
        result,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    同步分类（清理未使用的分类）
// @route   POST /api/admin/sync-categories
// @access  Public
exports.syncCategories = async (req, res, next) => {
  try {
    // 1. 查找所有分类
    const allCategories = await Category.find();

    // 2. 查找所有文章中使用的分类ID
    const usedCategoryIds = await Post.distinct("category");

    // 3. 确定需要删除的分类
    const categoriesToDelete = allCategories.filter(
      (category) =>
        !usedCategoryIds.some((id) => id.toString() === category._id.toString())
    );

    // 4. 删除未使用的分类
    const deleteResults = {
      total: categoriesToDelete.length,
      deleted: [],
    };

    for (const category of categoriesToDelete) {
      await Category.findByIdAndDelete(category._id);
      deleteResults.deleted.push({
        name: category.name,
        slug: category.slug,
        id: category._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: `分类同步完成。已删除${deleteResults.total}个未使用的分类。`,
        results: deleteResults,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    同步标签（清理未使用的标签）
// @route   POST /api/admin/sync-tags
// @access  Public
exports.syncTags = async (req, res, next) => {
  try {
    // 1. 查找所有标签
    const allTags = await Tag.find();

    // 2. 查找所有文章中使用的标签ID
    let usedTagIds = [];
    const posts = await Post.find().select("tags");

    // 提取所有使用中的标签ID
    posts.forEach((post) => {
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach((tagId) => {
          if (!usedTagIds.some((id) => id.toString() === tagId.toString())) {
            usedTagIds.push(tagId);
          }
        });
      }
    });

    // 3. 确定需要删除的标签
    const tagsToDelete = allTags.filter(
      (tag) => !usedTagIds.some((id) => id.toString() === tag._id.toString())
    );

    // 4. 删除未使用的标签
    const deleteResults = {
      total: tagsToDelete.length,
      deleted: [],
    };

    for (const tag of tagsToDelete) {
      await Tag.findByIdAndDelete(tag._id);
      deleteResults.deleted.push({
        name: tag.name,
        slug: tag.slug,
        id: tag._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: `标签同步完成。已删除${deleteResults.total}个未使用的标签。`,
        results: deleteResults,
      },
    });
  } catch (err) {
    next(err);
  }
};
