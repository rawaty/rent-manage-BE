const mongoose = require("mongoose");
const OtpSchema = new mongoose.Schema(
  {
    mobileNo: String,
    otp: String,
    expiresAt: { type: Date, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
    blockedUntil: { type: Date, default: null },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("Otp", OtpSchema);
