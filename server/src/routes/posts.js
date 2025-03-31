const express = require("express");
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  uploadMarkdown,
} = require("../controllers/postController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// 公开路由
router.get("/", getPosts);
router.get("/:id", getPost);

// 保护路由
router.post("/", protect, createPost);
router.post("/upload", protect, uploadMarkdown);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
