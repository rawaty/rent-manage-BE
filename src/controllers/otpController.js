const authService = require("../services/authService");
const otpService = require("../services/otpService");
const User = require("../models/User");
const STATUS = require("../utils/statusCode");
exports.sendOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    const user = await User.findOne({ mobileNo });
    if (!user) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
    }
    const otpMessage = await otpService.sendOtp(mobileNo);
    res.status(STATUS.OK).json(otpMessage);
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobileNo, otp } = req.body;
    const userData = await otpService.verifyOtp(mobileNo, otp, res);

    res.status(STATUS.OK).json(userData);
  } catch (err) {
    res.status(STATUS.OK).json({
      success: false,
      data: err.message,
    });
  }
};
