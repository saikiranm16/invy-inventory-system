const { ensureDemoInventory } = require("../utils/seedInventory");
const { logAdminActivity } = require("../utils/adminActivityLogger");

exports.seedDemoInventory = async (req, res) => {
  try {
    const result = await ensureDemoInventory();
    await logAdminActivity({
      adminId: req.user.id,
      action: "sync_demo_inventory",
      targetType: "setup",
      targetId: "demo-inventory",
      details: result,
    });

    res.json({
      message: "Demo inventory synced successfully",
      ...result,
    });
  } catch (err) {
    console.error("Seed demo inventory error:", err);
    res.status(500).json({ message: "Unable to sync demo inventory right now" });
  }
};
