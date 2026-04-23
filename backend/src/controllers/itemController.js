const mongoose = require("mongoose");
const Item = require("../models/Item");
const { logAdminActivity } = require("../utils/adminActivityLogger");

const buildItemPayload = (body) => {
  const payload = {};

  if (body.name !== undefined) {
    payload.name = String(body.name).trim();
  }

  if (body.quantity !== undefined) {
    payload.quantity = Number(body.quantity);
  }

  if (body.price !== undefined) {
    payload.price = Number(body.price);
  }

  if (body.category !== undefined) {
    payload.category = body.category;
  }

  return payload;
};

const validateItemPayload = (payload, { partial = false } = {}) => {
  if (!partial || payload.name !== undefined) {
    if (!payload.name || String(payload.name).trim().length < 2) {
      return "Item name must be at least 2 characters long";
    }
  }

  if (!partial || payload.quantity !== undefined) {
    if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
      return "Quantity must be a valid non-negative number";
    }
  }

  if (!partial || payload.price !== undefined) {
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return "Price must be a valid non-negative number";
    }
  }

  if (!partial || payload.category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(payload.category)) {
      return "Select a valid category";
    }
  }

  return null;
};

// Add Item (Admin)
exports.createItem = async (req, res) => {
  try {
    const payload = buildItemPayload(req.body);
    const validationError = validateItemPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const item = await Item.create(payload);
    const populatedItem = await item.populate("category");
    await logAdminActivity({
      adminId: req.user.id,
      action: "create_item",
      targetType: "item",
      targetId: item._id,
      details: {
        name: item.name,
        quantity: item.quantity,
      },
    });

    res.status(201).json(populatedItem);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)[0]?.message || "Enter valid item details",
      });
    }

    console.error("Create item error:", err);
    res.status(500).json({ message: "Unable to create item right now" });
  }
};

// Get All Items (User + Admin)
exports.getItems = async (req, res) => {
  try {
    const { search = "", category = "" } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    const items = await Item.find(filter)
      .populate("category")
      .sort({ createdAt: -1, name: 1 });

    res.json(items);
  } catch (err) {
    console.error("Get items error:", err);
    res.status(500).json({ message: "Unable to load items right now" });
  }
};

// Update Item (Admin)
exports.updateItem = async (req, res) => {
  try {
    const payload = buildItemPayload(req.body);
    const validationError = validateItemPayload(payload, { partial: true });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    ).populate("category");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "update_item",
      targetType: "item",
      targetId: item._id,
      details: {
        name: item.name,
      },
    });

    res.json(item);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)[0]?.message || "Enter valid item details",
      });
    }

    console.error("Update item error:", err);
    res.status(500).json({ message: "Unable to update item right now" });
  }
};

// Delete Item (Admin)
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "delete_item",
      targetType: "item",
      targetId: item._id,
      details: {
        name: item.name,
      },
    });

    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ message: "Unable to delete item right now" });
  }
};

// Restock Item (Admin)
exports.restockItem = async (req, res) => {
  const quantity = Number(req.body.quantity);

  if (Number.isNaN(quantity) || quantity === 0) {
    return res
      .status(400)
      .json({ message: "Quantity change must be a non-zero number" });
  }

  try {
    const item = await Item.findById(req.params.id).populate("category");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const nextQuantity = item.quantity + quantity;

    if (nextQuantity < 0) {
      return res.status(400).json({ message: "Quantity cannot go below zero" });
    }

    item.quantity = nextQuantity;

    await item.save();
    await logAdminActivity({
      adminId: req.user.id,
      action: "restock_item",
      targetType: "item",
      targetId: item._id,
      details: {
        name: item.name,
        quantityChange: quantity,
        nextQuantity,
      },
    });

    res.json(item);
  } catch (err) {
    console.error("Restock item error:", err);
    res.status(500).json({ message: "Unable to update item quantity right now" });
  }
};
