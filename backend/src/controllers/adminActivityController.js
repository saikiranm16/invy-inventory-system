const AdminActivity = require("../models/AdminActivity");

exports.getRecentAdminActivity = async (req, res) => {
  try {
    const logs = await AdminActivity.find()
      .populate("admin", "name email role")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      logs: logs.map((log) => ({
        id: log._id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details || {},
        createdAt: log.createdAt,
        admin: log.admin
          ? {
              id: log.admin._id,
              name: log.admin.name,
              email: log.admin.email,
              role: log.admin.role,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("Get admin activity error:", err);
    res.status(500).json({ message: "Unable to load admin activity right now" });
  }
};
