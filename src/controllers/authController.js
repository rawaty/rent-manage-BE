const authService = require("../services/authService");
const STATUS = require("../utils/statusCode");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);

    res.status(STATUS.CREATED).json({
      data: user,
    });
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailId, mobileNo, password } = req.body;
    const user = await authService.login(emailId, mobileNo, password, res);

    res.status(STATUS.OK).json({
      data: user,
    });
  } catch (err) {
    res.status(STATUS.OK).json({
      success: true,
      data: err.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const logoutUser = await authService.logout(res);

    res.status(STATUS.OK).json({
      success: true,
      data: logoutUser,
    });
  } catch (err) {
    res.status(STATUS.OK).json({
      success: false,
      data: err.message,
    });
  }
};
