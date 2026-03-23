const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
  logScan,
  getStudentQrStatus,
  getSecurityPin,
  getOutsideStudents,
  getLateStudents,
  getAllLogs,
  getMyStatus
} = require("../controllers/qrController.js");

const router = express.Router();

// Public scan/status for gate QR flow
router.get("/status/:studentId", getStudentQrStatus);
router.post("/scan", logScan);
router.get("/security-pin", authenticate, authorize("security", "admin"), getSecurityPin);

// Warden/Security views
router.get("/outside", authenticate, authorize("warden", "security", "admin"), getOutsideStudents);
router.get("/late", authenticate, authorize("warden", "security", "admin"), getLateStudents);
router.get("/logs", authenticate, authorize("warden", "security", "admin"), getAllLogs);
router.get("/my-status", authenticate, authorize("student"), getMyStatus);

module.exports = router;
