const mongoose = require("mongoose");
const slugify = require("slugify");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "分类名称必填"],
      unique: true,
      trim: true,
      maxlength: [50, "分类名称不能超过50个字符"],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      maxlength: [500, "描述不能超过500个字符"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 创建文章数量的虚拟字段
CategorySchema.virtual("postCount", {
  ref: "Post",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// 自动生成 slug
CategorySchema.pre("save", function (next) {
  if (this.name) {
    // 检查是否为纯中文或特殊字符
    const isPureNonLatinOrSpecial = /^[^\w]|^[\u4e00-\u9fa5]+$/.test(this.name);

    if (isPureNonLatinOrSpecial) {
      // 对于纯中文或特殊字符，使用随机字符串 + 时间戳作为slug的一部分
      const timestamp = Date.now().toString().slice(-6);
      const randomStr = Math.random().toString(36).substring(2, 5);
      this.slug = `${randomStr}-${timestamp}-${this.name.length}`;
    } else {
      // 对于包含拉丁字符的混合内容，使用改进的slugify
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        locale: 'zh-CN',
        remove: /[*+~.()'"!:@]/g
      });

      // 如果slug为空，添加时间戳
      if (!this.slug || this.slug.length === 0) {
        const timestamp = Date.now().toString().slice(-6);
        this.slug = `category-${timestamp}`;
      }
    }
  } else {
    // 没有名称的备用方案
    this.slug = `category-${Date.now().toString().slice(-8)}`;
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
