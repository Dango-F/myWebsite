const Tag = require("../models/Tag");
const Post = require("../models/Post");
const mongoose = require("mongoose");

// @desc    获取所有标签
// @route   GET /api/tags
// @access  Public
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort("name");

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取单个标签
// @route   GET /api/tags/:id
// @access  Public
exports.getTag = async (req, res, next) => {
  try {
    // 支持通过 ID 或 slug 查找
    let tag;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      tag = await Tag.findById(req.params.id);
    } else {
      tag = await Tag.findOne({ slug: req.params.id });
    }

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "找不到标签",
      });
    }

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    创建标签
// @route   POST /api/tags
// @access  Private/Admin
exports.createTag = async (req, res, next) => {
  try {
    const tag = await Tag.create(req.body);

    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (err) {
    // 处理重复键错误
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "标签名称已存在",
      });
    }

    next(err);
  }
};

// @desc    更新标签
// @route   PUT /api/tags/:id
// @access  Private/Admin
exports.updateTag = async (req, res, next) => {
  try {
    let tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "找不到标签",
      });
    }

    tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (err) {
    // 处理重复键错误
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "标签名称已存在",
      });
    }

    next(err);
  }
};

// @desc    删除标签
// @route   DELETE /api/tags/:id
// @access  Private/Admin
exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "找不到标签",
      });
    }

    // 检查是否有博客使用此标签
    const postsWithTag = await Post.find({ tags: req.params.id });

    if (postsWithTag.length > 0) {
      // 从博客中移除该标签
      await Promise.all(
        postsWithTag.map((post) => {
          post.tags = post.tags.filter((t) => t.toString() !== req.params.id);
          return post.save();
        })
      );
    }

    await tag.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
