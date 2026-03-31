const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: false
    },
    type: {
      type: String,
      enum: ["info", "success", "error"],
      default: "info"
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, collection: process.env.NOTIFICATION_COLLECTION || "notifications" }
);

module.exports = mongoose.model("Notification", notificationSchema);
