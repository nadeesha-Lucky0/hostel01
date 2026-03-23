const Notification = require("../models/Notification");

async function getMyNotifications(req, res) {
  try {
    const limit = Number(req.query.limit || 20);
    const notifications = await Notification.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function clearMyNotifications(req, res) {
  try {
    const result = await Notification.deleteMany({ student: req.user.id });
    res.json({ message: "Notification history cleared", deletedCount: result.deletedCount || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getMyNotifications, clearMyNotifications };
