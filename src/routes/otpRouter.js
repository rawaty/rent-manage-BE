const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpController");
router.post("/sendOtp", otpController.sendOtp);
router.post("/verifyOtp", otpController.verifyOtp);

module.exports = router;
