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
TagSchema.pre("save", async function (next) {
  if (this.name) {
    // 检查是否为纯中文或特殊字符
    const isPureNonLatinOrSpecial = /^[^\w]|^[\u4e00-\u9fa5]+$/.test(this.name);

    let baseSlug;
    if (isPureNonLatinOrSpecial) {
      // 对于纯中文或特殊字符，使用随机字符串 + 时间戳作为slug的一部分
      const timestamp = Date.now().toString().slice(-6);
      const randomStr = Math.random().toString(36).substring(2, 5);
      baseSlug = `${randomStr}-${timestamp}-${this.name.length}`;
    } else {
      // 对于包含拉丁字符的混合内容，使用改进的slugify
      baseSlug = slugify(this.name, {
        lower: true,
        strict: true,
        locale: 'zh-CN',
        remove: /[*+~.()'"!:@]/g
      });

      // 如果slug为空，添加时间戳
      if (!baseSlug || baseSlug.length === 0) {
        const timestamp = Date.now().toString().slice(-6);
        baseSlug = `tag-${timestamp}`;
      }
    }

    // 检查slug是否已存在
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingTag = await this.constructor.findOne({ slug });
      if (!existingTag) {
        break;
      }
      // 如果存在，添加计数器
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  } else {
    // 没有名称的备用方案
    this.slug = `tag-${Date.now().toString().slice(-8)}`;
  }
  next();
});

module.exports = mongoose.model("Tag", TagSchema);

