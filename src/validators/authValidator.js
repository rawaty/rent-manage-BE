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

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
})
  .or("mobileNo", "emailId") // 🔥 at least one required
  .messages({
    "object.missing": "Either mobile number or email is required",
  });
