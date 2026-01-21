const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
    getProfile,
    updateProfile,
    updateTimeline,
    updateSkills,
    resetProfile,
} = require("../controllers/profileController");

// Profile CRUD routes
router.route("/").get(getProfile).put(protect, updateProfile);

router.route("/timeline").put(protect, updateTimeline);

router.route("/skills").put(protect, updateSkills);

router.route("/reset").post(protect, resetProfile);

module.exports = router;
