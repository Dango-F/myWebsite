const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, "待办事项内容不能为空"],
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium",
        },
        category: {
            type: String,
            required: [true, "待办事项分类不能为空"],
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // 如果你想实现用户认证，可以取消下面的注释
            // required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Todo", todoSchema); 