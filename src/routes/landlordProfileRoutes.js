const express = require("express");

const router = express.Router();
const auth = require("../middlewares/authMiddleware");

const landlordProfileController = require("../controllers/landlordProfileController");

router.post("/", auth, landlordProfileController.createLandlordProfile);
router.delete("/:id", auth, landlordProfileController.deleteLandlordProfile);
router.post("/update", auth, landlordProfileController.updateLandlordProfile);
router.post("/getProfile", auth, landlordProfileController.getProfileData);

module.exports = router;
