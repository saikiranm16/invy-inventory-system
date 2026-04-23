const express = require("express");
const protect = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");
const { seedDemoInventory } = require("../controllers/setupController");

const router = express.Router();

router.post("/demo-inventory", protect, isAdmin, seedDemoInventory);

module.exports = router;
