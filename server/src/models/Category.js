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
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
