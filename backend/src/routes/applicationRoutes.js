const express = require("express");
const router = express.Router();
const { authenticate, optionalAuthenticate, authorize } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const {
  createApplication,
  getMyApplication,
  getAllApplications,
  getApplicationById,
  updatePaymentStatus,
  allocateRoom,
  updateApplication,
  deleteApplication,
  updateMyApplication,
  deleteMyApplication,
  updatePublicApplication,
  deletePublicApplication,
} = require("../controllers/applicationController");

// public/student form submit
router.post("/", optionalAuthenticate, createApplication);
router.put("/public/:id", updatePublicApplication);
router.delete("/public/:id", deletePublicApplication);
router.get("/me", authenticate, authorize("student"), getMyApplication);
router.put("/me", authenticate, authorize("student"), updateMyApplication);
router.delete("/me", authenticate, authorize("student"), deleteMyApplication);
router.post("/upload-medical", authenticate, authorize("student"), upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: req.file.path, publicId: req.file.filename });
});

// protected management endpoints
router.get("/", authenticate, authorize("financial", "warden", "admin", "security"), getAllApplications);
router.get("/:id", authenticate, authorize("financial", "warden", "admin", "security"), getApplicationById);
router.put("/:id/payment", authenticate, authorize("financial", "security"), updatePaymentStatus);
router.put("/:id/allocate", authenticate, authorize("warden"), allocateRoom);
router.put("/:id", authenticate, authorize("admin", "financial", "warden", "security"), updateApplication);
router.delete("/:id", authenticate, authorize("admin"), deleteApplication);

module.exports = router;
