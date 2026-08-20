const Otp = require("../models/Otp");
const User = require("../models/User");
const CONSTANT = require("../utils/constants");
const authService = require("../services/authService");
const smsService = require("./smsService");

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

exports.sendOtp = async (mobileNo) => {
  const now = new Date();

  const record = await Otp.findOne({ mobileNo });

  if (record?.blockedUntil && record.blockedUntil > now) {
    return { success: false, message: "Too many requests. Try again later" };
  }

  if (record && record.lastSentAt > new Date(Date.now() - CONSTANT.COOLDOWN)) {
    return {
      success: false,
      message: "Please wait before requesting another OTP",
    };
  }

  // Reuse unexpired OTP, otherwise generate a fresh one
  const otp =
    record && record.expiresAt > now ? record.otp : exports.generateOTP();

  await Otp.findOneAndUpdate(
    { mobileNo },
    {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  // Actually deliver it — previously the code was stored but never sent
  await smsService.sendOtpSms(mobileNo, otp);

  return {
    success: true,
    message: "OTP sent successfully",
    // Development-only: lets the login flow be tested without an SMS gateway
    data: smsService.canExposeOtp() ? { devOtp: String(otp) } : null,
  };
};

exports.verifyOtp = async (mobileNo, enteredOtp, res) => {
  const user = await User.findOne({ mobileNo });
  if (!user) {
    return {
      success: false,
      message: "Mobile number not registered. Please sign up.",
    };
  }

  const record = await Otp.findOne({ mobileNo });
  if (!record) {
    return { success: false, message: "OTP not found. Please request a new one." };
  }

  if (record.blockedUntil && record.blockedUntil > new Date()) {
    return { success: false, message: "Too many attempts. Try again later" };
  }

  if (record.expiresAt < new Date()) {
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  if (Number(record.otp) !== Number(enteredOtp)) {
    record.attempts += 1;

    if (record.attempts >= CONSTANT.MAX_ATTEMPTS) {
      record.blockedUntil = new Date(Date.now() + CONSTANT.BLOCK_TIME);
      record.attempts = 0;
    }

    await record.save();
    return { success: false, message: "Invalid OTP" };
  }

  await Otp.deleteOne({ mobileNo });

  const token = authService.generateToken(user);
  const refreshToken = authService.generateRefreshToken(user);
  authService.setAuthCookie(res, token, refreshToken);
  const data = authService.buildAuthResponse(user, token, refreshToken);

  return { success: true, message: "OTP verified successfully", data };
};
