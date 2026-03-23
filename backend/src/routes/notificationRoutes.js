const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { getMyNotifications, clearMyNotifications } = require("../controllers/notificationController");

router.get("/me", authenticate, authorize("student"), getMyNotifications);
router.delete("/me", authenticate, authorize("student"), clearMyNotifications);

module.exports = router;
