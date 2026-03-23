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
const notificationRoutes = require("./routes/notificationRoutes.js");
const studentRoutes = require("./routes/studentRoutes.js");
const studentPaymentRoutes = require("./routes/studentPaymentRoutes.js");
const financialRoutes = require('./routes/financialRoutes');
const userRoutes = require("./routes/userRoutes.js");
const clearanceRoutes = require("./routes/clearanceRoutes.js");
const qrRoutes = require("./routes/qrRoutes.js");
const { getStats } = require("./controllers/allocationController.js");

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student-payments", studentPaymentRoutes);
app.use('/api/financial', financialRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clearance", clearanceRoutes);
app.use("/api/qr", qrRoutes);
app.get("/api/stats", getStats);

app.get("/", (req, res) => {
  res.send("Smart Hostel API is running...");
});

// Serve static assets
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// API Routes (already defined above)
// ... but we need a catch-all for SPA AFTER routes

// 404 Handler - MUST be after all routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ success: false, msg: `Route ${req.originalUrl} not found` });
  }
  next();
});

// Catch-all for React Router
app.get('*all', (req, res) => {
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

// Multer / file upload error handler
const multer = require('multer');
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  if (err instanceof multer.MulterError) {
    // Multer-specific errors (file too large, too many files, etc.)
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

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});