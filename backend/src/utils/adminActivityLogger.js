const AdminActivity = require("../models/AdminActivity");

const logAdminActivity = async ({
  adminId,
  action,
  targetType,
  targetId = "",
  details = {},
}) => {
  if (!adminId || !action || !targetType) {
    return;
  }

  try {
    await AdminActivity.create({
      admin: adminId,
      action,
      targetType,
      targetId: String(targetId || ""),
      details,
    });
  } catch (error) {
    console.error("Failed to write admin activity log:", error.message);
  }
};

module.exports = {
  logAdminActivity,
};
