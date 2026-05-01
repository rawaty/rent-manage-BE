const rateLimit = require("express-rate-limit");

exports.otpLimiterPerMobile = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.mobileNo, // 🔥 important
  message: {
    success: false,
    message: "Too many OTP attempts for this number",
  },
});
