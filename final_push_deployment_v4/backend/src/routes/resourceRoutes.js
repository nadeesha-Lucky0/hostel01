const express = require("express");
const router = express.Router();
const {
  getResources,
  getStudents,
  createResource,
  updateResource,
  deleteResource,
  allocateResource,
  getAllocations,
  returnResource,
} = require("../controllers/resourceController.js");

router.route("/").get(getResources).post(createResource);
router.route("/students").get(getStudents);
router.route("/allocations").get(getAllocations);
router.route("/allocate").post(allocateResource);
router.route("/return/:id").post(returnResource);
router.route("/:id").put(updateResource).delete(deleteResource);

module.exports = router;