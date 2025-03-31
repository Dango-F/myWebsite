const Category = require("../models/Category");
const Post = require("../models/Post");
const mongoose = require("mongoose");

// @desc    获取所有分类
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    // 查询所有分类，并包含文章计数
    const categories = await Category.find().populate("postCount");

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取单个分类
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    // 支持通过 ID 或 slug 查找
    let category;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      category = await Category.findById(req.params.id);
    } else {
      category = await Category.findOne({ slug: req.params.id });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "找不到分类",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    创建分类
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (err) {
    // 处理重复键错误
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "分类名称已存在",
      });
    }

    next(err);
  }
};

// @desc    更新分类
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "找不到分类",
      });
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    // 处理重复键错误
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "分类名称已存在",
      });
    }

    next(err);
  }
};

// @desc    删除分类
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "找不到分类",
      });
    }

    // 检查是否有文章使用此分类
    const posts = await Post.find({ category: req.params.id });

    if (posts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "无法删除正在使用的分类",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
