const express = require("express");

const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { uploadDocument } = require("../middlewares/upload");
const landlordProfileController = require("../controllers/landlordProfileController");

router.post("/", auth, landlordProfileController.createLandlordProfile);
router.delete(
  "/delete/:id",
  auth,
  landlordProfileController.deleteLandlordProfile
);
router.patch(
  "/update",
  auth,
  uploadDocument.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  landlordProfileController.updateLandlordProfile
);
router.get("/getProfile/:id", auth, landlordProfileController.getProfileData);

module.exports = router;
