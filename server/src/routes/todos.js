const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");

// 获取所有待办事项
router.get("/", todoController.getAllTodos);

// 创建新的待办事项
router.post("/", todoController.createTodo);

// 更新待办事项
router.put("/:id", todoController.updateTodo);

// 删除待办事项
router.delete("/:id", todoController.deleteTodo);

module.exports = router; 