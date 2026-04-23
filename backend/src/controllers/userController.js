const User = require("../models/User");
const { logAdminActivity } = require("../utils/adminActivityLogger");

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const countAdmins = () => User.countDocuments({ role: "admin" });

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      users: users.map(serializeUser),
      summary: {
        totalUsers: users.length,
        admins: users.filter((user) => user.role === "admin").length,
        standardUsers: users.filter((user) => user.role === "user").length,
      },
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Unable to load users right now" });
  }
};

exports.updateUserRole = async (req, res) => {
  const nextRole = String(req.body.role || "").trim();

  if (!["admin", "user"].includes(nextRole)) {
    return res.status(400).json({ message: "Role must be either admin or user" });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === nextRole) {
      return res.json({
        message: `User is already a ${nextRole}`,
        user: serializeUser(user),
      });
    }

    if (user.role === "admin" && nextRole === "user") {
      const totalAdmins = await countAdmins();

      if (totalAdmins <= 1) {
        return res.status(400).json({
          message: "At least one admin must remain in the workspace",
        });
      }
    }

    user.role = nextRole;
    await user.save();
    await logAdminActivity({
      adminId: req.user.id,
      action: "update_user_role",
      targetType: "user",
      targetId: user._id,
      details: {
        email: user.email,
        nextRole,
      },
    });

    res.json({
      message: `User role updated to ${nextRole}`,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: "Unable to update user role right now" });
  }
};
