const otpService = require("../services/otpService");
const User = require("../models/User");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.sendOtp = async (req, res, next) => {
  try {
    const { mobileNo } = req.body;

    const user = await User.findOne({ mobileNo });
    if (!user) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    const result = await otpService.sendOtp(mobileNo);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: result.message,
      data: result.data ?? null,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { mobileNo, otp } = req.body;
    const result = await otpService.verifyOtp(mobileNo, otp, res);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};
