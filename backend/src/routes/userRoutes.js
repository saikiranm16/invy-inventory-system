const express = require("express");
const protect = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");
const { getUsers, updateUserRole } = require("../controllers/userController");

const router = express.Router();

router.get("/", protect, isAdmin, getUsers);
router.put("/:id/role", protect, isAdmin, updateUserRole);

module.exports = router;
