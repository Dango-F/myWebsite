const express = require("express");
const {
    getUserConfig,
    updateGithubToken,
    deleteGithubToken
} = require("../controllers/configController");

const router = express.Router();

// 获取用户配置
router.get("/", getUserConfig);

// 更新GitHub Token
router.post("/github-token", updateGithubToken);

// 删除GitHub Token
router.delete("/github-token", deleteGithubToken);

module.exports = router; 