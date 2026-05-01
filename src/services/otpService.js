const Otp = require("../models/Otp");
const User = require("../models/User");
const CONSTANT = require("../utils/constants");

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

exports.sendOtp = async (mobileNo) => {
  let otp;
  const now = new Date();

  try {
    const record = await Otp.findOne({ mobileNo });

    if (record?.blockedUntil && record.blockedUntil > now) {
      throw new Error("Too many requests. Try again later");
    }
    if (
      record &&
      record.lastSentAt > new Date(Date.now() - CONSTANT.COOLDOWN)
    ) {
      throw new Error("Please wait before requesting another OTP");
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

    return "OTP sent successfully";
  } catch (err) {
    throw err;
  }
};

exports.verifyOtp = async (mobileNo, enteredOtp) => {
  try {
    const user = await User.findOne({
      mobileNo,
    });
    if (!user) {
      throw new Error("mobile number is incorrect, please sign in");
    }
    const record = await Otp.findOne({
      mobileNo,
    });

    if (!record) {
      throw new Error("OTP not found");
    }
    if (record.blockedUntil && record.blockedUntil > new Date()) {
      throw new Error("Too many attempts. Try again later");
    }
    //check expiry
    if (record.expiresAt < new Date()) {
      throw new Error("Otp Expired.");
    }
    if (Number(record.otp) !== Number(enteredOtp)) {
      record.attempts += 1;
      if (record.attempts >= CONSTANT.MAX_ATTEMPTS) {
        record.blockedUntil = new Date(Date.now() + CONSTANT.BLOCK_TIME);
        record.attempts = 0; // reset
      }
      await record.save();
      throw new Error("Invalid OTP");
    }

    await Otp.deleteOne({ mobileNo });

    return { message: "Otp verified", user };
  } catch (err) {
    throw err;
  }
};
