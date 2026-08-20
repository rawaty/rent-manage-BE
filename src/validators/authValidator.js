const Joi = require("joi");
const mobileRegex = /^[6-9]\d{9}$/;

exports.sendOtpSchema = Joi.object({
  mobileNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "any.required": "Mobile number is required",
      "string.pattern.base": "Enter a valid mobile number",
    }),
});

// 🔐 Verify OTP validation
exports.verifyOtpSchema = Joi.object({
  mobileNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "any.required": "Mobile number is required",
      "string.pattern.base": "Enter a valid mobile number",
    }),
  otp: Joi.string().length(6).required(),
});

exports.loginEmailOrMobileSchema = Joi.object({
  mobileNo: Joi.string().pattern(/^[6-9]\d{9}$/),
  emailId: Joi.string().email({ tlds: { allow: false } }),
  password: Joi.string().required(),
})
  .xor("mobileNo", "emailId") // 🔥 only one allowed
  .messages({
    "object.missing": "Either mobile number or email is required",
    "object.xor": "Provide either mobile number or email, not both",
  });

exports.register = Joi.object({
  // Required by the User model — validate it here instead of failing at Mongoose
  name: Joi.string().trim().min(2).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 2 characters",
    "any.required": "Full name is required",
  }),

  mobileNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .messages({
      "string.pattern.base": "Enter a valid mobile number",
    }),

  emailId: Joi.string()
    .email({ tlds: { allow: false } })
    .messages({
      "string.email": "Enter a valid email",
    }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),

  role: Joi.string()
    .valid("OWNER", "MANAGER", "PG_OWNER", "ADMIN")
    .default("OWNER")
    .messages({
      "any.only": "Invalid role selected",
    }),
})
  .or("mobileNo", "emailId") // 🔥 at least one required
  .messages({
    "object.missing": "Either mobile number or email is required",
  });
