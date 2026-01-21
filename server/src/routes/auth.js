const express = require("express");
const { register, login, getMe, updatePassword, updateUsername } = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/password", protect, updatePassword);
router.put("/username", protect, updateUsername);

module.exports = router;
