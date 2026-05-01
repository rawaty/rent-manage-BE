const mongoose = require("mongoose");
const OtpSchema = new mongoose.Schema(
  {
    mobileNo: String,
    otp: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    blockedUntil: { type: Date, default: null },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // 🔥 this adds createdAt & updatedAt automatically
  }
);

module.exports = new mongoose.model("Otp", OtpSchema);
