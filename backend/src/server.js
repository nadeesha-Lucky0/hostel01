const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db.js");

const floorRoutes = require("./routes/floors.js");
const roomRoutes = require("./routes/rooms.js");
const allocationRoutes = require("./routes/allocations.js");
const authRoutes = require("./routes/authRoutes.js");
const complaintRoutes = require("./routes/complaints.js");
const noticeRoutes = require("./routes/notice.js");
const applicationRoutes = require("./routes/applicationRoutes.js");
const studentPaymentRoutes = require("./routes/studentPaymentRoutes.js");
const financialRoutes = require('./routes/financialRoutes');
const userRoutes = require("./routes/userRoutes.js");
const clearanceRoutes = require("./routes/clearanceRoutes.js");
const qrRoutes = require("./routes/qrRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const leaveRoutes = require("./routes/leaveRoutes.js");
const resourceRoutes = require("./routes/resourceRoutes.js");
const { getStats } = require("./controllers/allocationController.js");
const { ensureDefaultAdmin } = require("./utils/ensureDefaultAdmin.js");

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use("/api/floors", floorRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/student-payments", studentPaymentRoutes);
app.use('/api/financial', financialRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clearance", clearanceRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/resources", resourceRoutes);
app.get("/api/stats", getStats);

// Serve static assets (Frontend)
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all for React Router - MUST be after all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

// Multer / file upload error handler
const multer = require('multer');
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, msg: `Upload Error: ${err.message}` });
  }
  if (err && err.message && err.message.includes('File type')) {
    return res.status(400).json({ success: false, msg: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await ensureDefaultAdmin();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
