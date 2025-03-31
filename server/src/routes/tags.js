const express = require("express");
const {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} = require("../controllers/tagController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// 公开路由
router.get("/", getTags);
router.get("/:id", getTag);

// 保护路由 (仅管理员)
router.post("/", protect, authorize("admin"), createTag);
router.put("/:id", protect, authorize("admin"), updateTag);
router.delete("/:id", protect, authorize("admin"), deleteTag);

module.exports = router;
