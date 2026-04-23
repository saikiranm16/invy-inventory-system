const express = require("express");
const protect = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");
const { getRecentAdminActivity } = require("../controllers/adminActivityController");

const router = express.Router();

router.get("/", protect, isAdmin, getRecentAdminActivity);

module.exports = router;
