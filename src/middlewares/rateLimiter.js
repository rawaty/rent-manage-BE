const rateLimit = require("express-rate-limit");

// Automated tests drive these endpoints far harder than a real user would.
// Only ever true when NODE_ENV is explicitly "test" — never in production.
const skipInTests = () => process.env.NODE_ENV === "test";

// Keyed by mobile number so one number cannot be flooded from many IPs.
// Falls back to IP when the body is missing/malformed.
const mobileKey = (req) => req.body?.mobileNo || req.ip;

exports.otpLimiterPerMobile = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: mobileKey,
  // The key is a phone number, not an IP, so skip the IPv6-normalisation check
  validate: { keyGeneratorIpFallback: false },
  skip: skipInTests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP attempts for this number",
    errors: null,
  },
});

/**
 * Public, unauthenticated endpoints (shared property page, "I'm Interested",
 * tokenised application form). Keyed by IP — there is no account to key on.
 */
exports.publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  skip: skipInTests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
    errors: null,
  },
});

exports.publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  skip: skipInTests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many submissions. Please try again later.",
    errors: null,
  },
});

exports.otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: mobileKey,
  validate: { keyGeneratorIpFallback: false },
  skip: skipInTests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later",
    errors: null,
  },
});
