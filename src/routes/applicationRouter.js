const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const { uploadDocument } = require("../middlewares/upload");
const applicationController = require("../controllers/applicationController");

router.get("/", auth, applicationController.listApplications);

// Landlord fills the form on the applicant's behalf, attesting to their consent
router.post(
  "/",
  auth,
  uploadDocument.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "photograph", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  applicationController.createByLandlord
);

router.get("/:id", auth, applicationController.getApplication);

// Accepting assigns the property and auto-declines every other applicant
router.post("/:id/accept", auth, applicationController.acceptApplication);
router.post("/:id/reject", auth, applicationController.rejectApplication);

module.exports = router;
