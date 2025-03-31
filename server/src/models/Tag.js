const mongoose = require("mongoose");
const slugify = require("slugify");

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "标签名称必填"],
    unique: true,
    trim: true,
    maxlength: [20, "标签名称不能超过20个字符"],
  },
  slug: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 自动生成 slug
TagSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model("Tag", TagSchema);
