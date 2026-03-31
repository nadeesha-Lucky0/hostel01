const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "ALLOCATED", "MAINTENANCE"],
      default: "AVAILABLE",
    },
  },
  { 
    collection: 'resources',
    timestamps: true 
  }
);

module.exports = mongoose.model("Resource", resourceSchema);