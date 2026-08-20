const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpController");
const { validate } = require("../middlewares/validate");
const {
  otpLimiterPerMobile,
  otpVerifyLimiter,
} = require("../middlewares/rateLimiter");
const {
  sendOtpSchema,
  verifyOtpSchema,
} = require("../validators/authValidator");

router.post(
  "/sendOtp",
  validate(sendOtpSchema),
  otpLimiterPerMobile,
  otpController.sendOtp
);
router.post(
  "/verifyOtp",
  validate(verifyOtpSchema),
  otpVerifyLimiter,
  otpController.verifyOtp
);

module.exports = router;
