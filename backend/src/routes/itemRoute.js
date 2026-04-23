const express = require("express");
const protect = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");

const {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  restockItem,
} = require("../controllers/itemController");

const router = express.Router();

// Admin
router.post("/", protect, isAdmin, createItem);
router.put("/:id", protect, isAdmin, updateItem);
router.delete("/:id", protect, isAdmin, deleteItem);

// User + Admin
router.get("/", protect, getItems);

router.put("/restock/:id", protect, isAdmin, restockItem);

module.exports = router;
