const express = require("express");

const router = express.Router();
const auth = require("../middlewares/authMiddleware");

const landlordProfileController = require("../controllers/landlordProfileController");

router.post("/", auth, landlordProfileController.createLandlordProfile);
router.delete("/:id", landlordProfileController.deleteLandlordProfile);

module.exports = router;
