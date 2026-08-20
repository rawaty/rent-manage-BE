const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const enquiryController = require("../controllers/enquiryController");
const applicationController = require("../controllers/applicationController");

router.get("/", auth, enquiryController.listEnquiries);
router.get("/:id", auth, enquiryController.getEnquiry);
router.patch("/:id/status", auth, enquiryController.updateStatus);
router.delete("/:id", auth, enquiryController.deleteEnquiry);

// Generate + send the tenant-facing application link for this enquiry
router.post("/:enquiryId/invite", auth, applicationController.createInvite);

module.exports = router;
