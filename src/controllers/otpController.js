const authService = require("../services/authService");
const otpService = require("../services/otpService");
const STATUS = require("../utils/statusCode");
exports.sendOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    const otpMessage = await otpService.sendOtp(mobileNo);
    res.status(STATUS.OK).json({
      success: true,
      message: otpMessage,
    });
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
    // const token = authService.generateToken(userData);
    // authService.setAuthCookie(res, token);
    // const data = authService.buildAuthResponse(userData?.user, token);

    res.status(STATUS.OK).json({
      data: userData,
    });
  } catch (err) {
    res.status(STATUS.OK).json({
      success: false,
      data: err.message,
    });
  }
};
