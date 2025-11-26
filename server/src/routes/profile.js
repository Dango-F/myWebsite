const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updateTimeline,
    updateSkills,
    resetProfile,
} = require("../controllers/profileController");

// Profile CRUD routes
router.route("/").get(getProfile).put(updateProfile);

router.route("/timeline").put(updateTimeline);

router.route("/skills").put(updateSkills);

router.route("/reset").post(resetProfile);

module.exports = router;
