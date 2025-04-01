const mongoose = require("mongoose");
const slugify = require("slugify");
const mongoosePaginate = require("mongoose-paginate-v2");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "文章标题必填"],
      trim: true,
      maxlength: [200, "标题不能超过200个字符"],
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "文章内容必填"],
    },
    html_content: {
      type: String,
    },
    featured_image: {
      type: String,
      default: "default-blog.jpg",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Tag",
      },
    ],
    file_name: {
      type: String,
      // 存储当前文件名（可能包含文章ID前缀）
    },
    original_file_name: {
      type: String,
      // 存储原始上传文件名，不含路径
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    // 发布日期字段，用于前端显示博客发布时间
    date: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 自动生成 slug 并更新相关字段
PostSchema.pre("save", function (next) {
  // 更新title时更新slug
  if (this.isModified("title")) {
    // 生成基础 slug
    const baseSlug = slugify(this.title, { lower: true });

    // 添加随机字符串和日期，确保唯一性
    const randomStr = Math.random().toString(36).substring(2, 6);
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

    this.slug = `${baseSlug}-${dateStr}-${randomStr}`;
  }

  // 更新updatedAt字段
  this.updatedAt = Date.now();

  // 如果状态改为已发布，更新发布日期
  if (this.isModified("status") && this.status === "published") {
    this.date = new Date();
  }

  next();
});

// 更新文章时更新 updatedAt 字段
PostSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加分页插件
PostSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Post", PostSchema);
