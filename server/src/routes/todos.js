const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { protect } = require("../middlewares/auth");

// 获取所有待办事项
router.get("/", todoController.getAllTodos);

// 创建新的待办事项
router.post("/", protect, todoController.createTodo);

// 更新待办事项
router.put("/:id", protect, todoController.updateTodo);

// 删除待办事项
router.delete("/:id", protect, todoController.deleteTodo);

module.exports = router; 