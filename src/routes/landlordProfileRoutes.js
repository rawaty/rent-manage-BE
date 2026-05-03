const express = require("express");

const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const landlordProfileController = require("../controllers/landlordProfileController");

router.post("/", auth, landlordProfileController.createLandlordProfile);
router.delete(
  "/delete/:id",
  auth,
  landlordProfileController.deleteLandlordProfile
);
router.post(
  "/update",
  auth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  landlordProfileController.updateLandlordProfile
);
router.post("/getProfile", auth, landlordProfileController.getProfileData);

module.exports = router;
