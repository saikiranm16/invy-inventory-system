const Category = require("../models/Category");
const { logAdminActivity } = require("../utils/adminActivityLogger");

const normalizeCategoryName = (name) => String(name || "").trim();

// Create Category (Admin)
exports.createCategory = async (req, res) => {
  try {
    const name = normalizeCategoryName(req.body.name);

    if (name.length < 2) {
      return res.status(400).json({ message: "Category name must be at least 2 characters long" });
    }

    const category = await Category.create({
      name,
    });
    await logAdminActivity({
      adminId: req.user.id,
      action: "create_category",
      targetType: "category",
      targetId: category._id,
      details: {
        name: category.name,
      },
    });

    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A category with this name already exists" });
    }

    console.error("Create category error:", err);
    res.status(500).json({ message: "Unable to create category right now" });
  }
};

// Get All Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ message: "Unable to load categories right now" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const name = normalizeCategoryName(req.body.name);

    if (name.length < 2) {
      return res.status(400).json({ message: "Category name must be at least 2 characters long" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "update_category",
      targetType: "category",
      targetId: category._id,
      details: {
        name: category.name,
      },
    });

    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A category with this name already exists" });
    }

    console.error("Update category error:", err);
    res.status(500).json({ message: "Unable to update category right now" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "delete_category",
      targetType: "category",
      targetId: category._id,
      details: {
        name: category.name,
      },
    });

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ message: "Unable to delete category right now" });
  }
};
