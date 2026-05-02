const Otp = require("../models/Otp");
const User = require("../models/User");
const CONSTANT = require("../utils/constants");
const authService = require("../services/authService");
const jwt = require("jsonwebtoken");

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

exports.sendOtp = async (mobileNo) => {
  let otp;
  const now = new Date();

  try {
    const record = await Otp.findOne({ mobileNo });

    if (record?.blockedUntil && record.blockedUntil > now) {
      return {
        success: false,
        message: "Too many requests. Try again later",
      };
    }
    if (
      record &&
      record.lastSentAt > new Date(Date.now() - CONSTANT.COOLDOWN)
    ) {
      return {
        success: false,
        message: "Please wait before requesting another OTP",
      };
    }

    if (record && record.expiresAt > now) {
      otp = record.otp;
    } else {
      otp = exports.generateOTP();
    }

    await Otp.findOneAndUpdate(
      { mobileNo },
      {
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );

    return { success: true, message: "Otp sent successfully" };
  } catch (err) {
    throw err;
  }
};

exports.verifyOtp = async (mobileNo, enteredOtp, res) => {
  try {
    const user = await User.findOne({
      mobileNo,
    });
    if (!user) {
      return {
        success: false,
        message: "mobile number is incorrect, please sign in",
      };
    }
    const record = await Otp.findOne({
      mobileNo,
    });

    if (!record) {
      return {
        success: false,
        message: "OTP not found",
      };
    }
    if (record.blockedUntil && record.blockedUntil > new Date()) {
      return {
        success: false,
        message: "Too many attempts. Try again later",
      };
    }
    //check expiry
    if (record.expiresAt < new Date()) {
      return {
        success: false,
        message: "Otp Expired.",
      };
    }
    if (Number(record.otp) !== Number(enteredOtp)) {
      record.attempts += 1;
      if (record.attempts >= CONSTANT.MAX_ATTEMPTS) {
        record.blockedUntil = new Date(Date.now() + CONSTANT.BLOCK_TIME);
        record.attempts = 0; // reset
      }
      await record.save();

      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    await Otp.deleteOne({ mobileNo });
    const token = authService.generateToken(user);
    authService.setAuthCookie(res, token);
    const data = authService.buildAuthResponse(user, token);
    return { success: true, message: "Otp verified", data };
  } catch (err) {
    throw err;
  }
};
