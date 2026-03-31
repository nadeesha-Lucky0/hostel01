const Resource = require("../models/Resource.js");
const ResourceAllocation = require("../models/ResourceAllocation.js");
const User = require("../models/User.js");

const MAX_ACTIVE_ALLOCATIONS_PER_STUDENT = 2;

// Get all resources
// GET /api/resources
exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get students 
// GET /api/resources/students
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student'
    }).select("_id name email role studentId"); // User model uses studentId

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create resource
// POST /api/resources
exports.createResource = async (req, res) => {
  try {
    const { name, category, status } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const existingResource = await Resource.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      category: { $regex: `^${category.trim()}$`, $options: "i" },
    });

    if (existingResource) {
      return res.status(409).json({ message: "A resource with the same name and category already exists" });
    }

    const resource = await Resource.create({
      name: name.trim(),
      category: category.trim(),
      status: status || "AVAILABLE",
    });

    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update resource
// PUT /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const { name, category, status } = req.body;

    if (status === "AVAILABLE" && resource.status === "ALLOCATED") {
      const activeAlloc = await ResourceAllocation.findOne({
        resource: resource._id,
        status: "ACTIVE",
      });

      if (activeAlloc) {
        return res.status(400).json({ message: "Cannot set to AVAILABLE while it has an ACTIVE allocation" });
      }
    }

    resource.name = name || resource.name;
    resource.category = category || resource.category;
    if (status) resource.status = status;

    const updated = await resource.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete resource
// DELETE /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.status === "ALLOCATED") {
      return res.status(400).json({ message: "Cannot delete resource: it is currently allocated" });
    }

    await resource.deleteOne();
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Allocate resource
// POST /api/resources/allocate
exports.allocateResource = async (req, res) => {
  try {
    const { resourceId, studentId } = req.body;

    if (!resourceId || !studentId) {
      return res.status(400).json({ message: "resourceId and studentId are required" });
    }

    const activeCount = await ResourceAllocation.countDocuments({
      student: studentId,
      status: "ACTIVE",
    });

    if (activeCount >= MAX_ACTIVE_ALLOCATIONS_PER_STUDENT) {
      return res.status(400).json({ message: `Student reached limit: ${MAX_ACTIVE_ALLOCATIONS_PER_STUDENT} active items` });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource || resource.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Resource not available for allocation" });
    }

    resource.status = "ALLOCATED";
    await resource.save();

    const allocation = await ResourceAllocation.create({
      resource: resourceId,
      student: studentId,
      status: "ACTIVE",
    });

    res.status(201).json(allocation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get allocations
// GET /api/resources/allocations
exports.getAllocations = async (req, res) => {
  try {
    const allocations = await ResourceAllocation.find()
      .populate("resource")
      .populate("student", "name email studentId")
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Return resource
// POST /api/resources/return/:id
exports.returnResource = async (req, res) => {
  try {
    const allocation = await ResourceAllocation.findById(req.params.id);

    if (!allocation || allocation.status === "RETURNED") {
      return res.status(400).json({ message: "Allocation not found or already returned" });
    }

    const resource = await Resource.findById(allocation.resource);
    if (resource) {
      resource.status = "AVAILABLE";
      await resource.save();
    }

    allocation.status = "RETURNED";
    allocation.returnedAt = new Date();
    await allocation.save();

    res.json({ message: "Resource returned successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};