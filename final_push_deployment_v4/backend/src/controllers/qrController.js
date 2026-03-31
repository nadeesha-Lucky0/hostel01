const QRLog = require("../models/QRLog.js");
const User = require("../models/User.js");
const { getPinMeta, validatePin } = require("../utils/securityPin.js");

// Helper: compute curfew time (adjust to your rules)
const getCurfewMinutes = (student) => {
  // If you have gender in profile later, replace this logic accordingly.
  // For now, return a single curfew (e.g., 22:30 = 1350 minutes)
  return 22 * 60 + 30;
};

const minutesNow = (date = new Date()) => date.getHours() * 60 + date.getMinutes();

// GET /api/qr/status/:studentId (public)
const getStudentQrStatus = async (req, res) => {
  try {
    const studentId = String(req.params.studentId || "").trim();
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    const student = await User.findOne({ studentId }).select("_id studentId role");
    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const latestLog = await QRLog.findOne({ studentUserId: student._id })
      .sort({ timestamp: -1 })
      .select("action timestamp");

    let status = "INSIDE";
    if (latestLog?.action === "exit") status = "OUTSIDE";
    if (latestLog?.action === "entry") status = "INSIDE";

    res.json({
      studentId: student.studentId,
      studentUserId: student._id,
      status,
      lastAction: latestLog ? latestLog.action.toUpperCase() : null,
      lastTime: latestLog ? latestLog.timestamp : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/qr/scan
const logScan = async (req, res) => {
  try {
    const { studentId, action, destination, goingHome = false, securityPin } = req.body;
    const normalizedStudentId = String(studentId || "").trim();
    const normalizedAction = String(action || "").toLowerCase();
    const normalizedDestination = typeof destination === "string" ? destination.trim() : "";
    const normalizedSecurityPin = String(securityPin || "").trim();

    if (!normalizedStudentId || !normalizedAction) {
      return res.status(400).json({ success: false, message: "studentId and action are required" });
    }

    if (!normalizedSecurityPin) {
      return res.status(400).json({ success: false, message: "securityPin is required" });
    }

    if (!validatePin(normalizedSecurityPin)) {
      return res.status(400).json({ success: false, message: "Invalid or expired security PIN" });
    }

    if (!["entry", "exit"].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: "action must be ENTRY or EXIT" });
    }

    if (normalizedAction === "exit" && !normalizedDestination) {
      return res.status(400).json({ success: false, message: "destination is required for exit" });
    }

    // ensure student exists
    const student = await User.findOne({ studentId: normalizedStudentId }).select("_id studentId role");
    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Create log
    const log = await QRLog.create({
      studentId: student.studentId,
      studentUserId: student._id,
      action: normalizedAction,
      destination: normalizedAction === "exit" ? normalizedDestination : undefined,
      goingHome,
      scannedBy: req.user?._id
    });

    // basic late flag (optional for response)
    let late = false;
    if (normalizedAction === "entry") {
      const curfew = getCurfewMinutes(student);
      late = !goingHome && minutesNow() > curfew;
    }

    res.status(201).json({ message: "Scan logged", log, late });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSecurityPin = async (_req, res) => {
  try {
    res.json(getPinMeta());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Determine “currently outside” = last action is exit (and not followed by entry)
const getOutsideStudents = async (req, res) => {
  try {
    const latest = await QRLog.aggregate([
      { $match: { studentUserId: { $exists: true, $ne: null } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$studentUserId",
          lastAction: { $first: "$action" },
          lastExitAt: { $first: "$createdAt" },
          destination: { $first: "$destination" },
          goingHome: { $first: "$goingHome" }
        }
      },
      { $match: { lastAction: "exit" } }
    ]);

    const studentIds = latest.map((row) => row._id);
    const students = await User.find({ _id: { $in: studentIds } }).select("name email phone studentId");
    const studentMap = new Map(
      students.map((student) => [
        String(student._id),
        {
          name: student.name,
          email: student.email,
          phone: student.phone,
          studentId: student.studentId
        }
      ])
    );

    const outside = latest.map((row) => ({
      student: studentMap.get(String(row._id)) || null,
      lastExitAt: row.lastExitAt,
      destination: row.destination,
      goingHome: row.goingHome,
      // simplify isLate logic for now or stick with getCurfewMinutes
      isLate: !row.goingHome && minutesNow(new Date(row.lastExitAt)) > getCurfewMinutes() 
    }));

    res.json({ outsideCount: outside.length, outside });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Late list: outside students + current time past curfew (simple version)
const getLateStudents = async (req, res) => {
  try {
    const outsideAgg = await QRLog.aggregate([
      { $match: { studentUserId: { $exists: true, $ne: null } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$studentUserId", last: { $first: "$$ROOT" } } },
      { $match: { "last.action": "exit", "last.goingHome": false } }
    ]);

    const studentIds = outsideAgg.map((x) => x._id);
    const students = await User.find({ _id: { $in: studentIds } }).select("name email phone");

    const nowMins = minutesNow();
    const late = students
      .map((s) => ({ s, curfew: getCurfewMinutes(s) }))
      .filter(({ curfew }) => nowMins > curfew)
      .map(({ s }) => s);

    res.json({ lateCount: late.length, lateStudents: late });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const logs = await QRLog.find({})
      .populate("studentUserId", "name email studentId")
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can check personal status" });
    }

    const latestLog = await QRLog.findOne({ studentUserId: req.user._id })
      .sort({ timestamp: -1 })
      .select("action timestamp destination goingHome");

    let status = "INSIDE";
    if (latestLog?.action === "exit") status = "OUTSIDE";
    if (latestLog?.action === "entry") status = "INSIDE";

    res.json({
      success: true,
      status,
      lastAction: latestLog ? latestLog.action.toUpperCase() : null,
      lastTime: latestLog ? latestLog.timestamp : null,
      destination: latestLog ? latestLog.destination : null,
      goingHome: latestLog ? latestLog.goingHome : false
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudentQrStatus,
  logScan,
  getSecurityPin,
  getOutsideStudents,
  getLateStudents,
  getAllLogs,
  getMyStatus
};
