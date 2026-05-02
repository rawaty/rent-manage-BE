const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpController");
const { validate } = require("../middlewares/validate");
const {
  sendOtpSchema,
  verifyOtpSchema,
} = require("../validators/authValidator");
router.post("/sendOtp", validate(sendOtpSchema), otpController.sendOtp);
router.post("/verifyOtp", validate(verifyOtpSchema), otpController.verifyOtp);

module.exports = router;
