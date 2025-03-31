const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "用户名必填"],
    unique: true,
    trim: true,
    minlength: [3, "用户名至少需要3个字符"],
  },
  email: {
    type: String,
    required: [true, "邮箱必填"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "请提供有效的邮箱地址",
    ],
  },
  password: {
    type: String,
    required: [true, "密码必填"],
    minlength: [6, "密码至少需要6个字符"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "editor"],
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 加密密码
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码方法
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
