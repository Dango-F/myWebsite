const express = require("express");
const {
  getStats,
  uploadImage,
  uploadPost,
  uploadPostsBatch,
  getPosts,
  updatePostStatus,
  deletePost,
  upload,
  uploadMultiple,
  syncFiles,
  syncCategories,
  syncTags,
} = require("../controllers/adminController");

const router = express.Router();

// 统计信息
router.get("/stats", getStats);

// 博客管理
router.get("/posts", getPosts);
router.put("/posts/:id/status", updatePostStatus);
router.delete("/posts/:id", deletePost);

// 上传相关
router.post("/upload-image", upload, uploadImage);
router.post("/upload-post", upload, uploadPost);
router.post("/upload-posts-batch", uploadMultiple, uploadPostsBatch);

// 同步文件系统和数据库
router.post("/sync-files", syncFiles);

// 同步分类和标签
router.post("/sync-categories", syncCategories);
router.post("/sync-tags", syncTags);

module.exports = router;
