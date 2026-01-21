const express = require("express");
const {
    getUserConfig,
    updateGithubToken,
    deleteGithubToken
} = require("../controllers/configController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// 获取用户配置
router.get("/", getUserConfig);

// 更新GitHub Token
router.post("/github-token", protect, updateGithubToken);

// 删除GitHub Token
router.delete("/github-token", protect, deleteGithubToken);

module.exports = router; 