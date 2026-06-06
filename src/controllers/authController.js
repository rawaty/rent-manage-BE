const authService = require("../services/authService");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    // Service signals a business-rule failure (e.g. user already exists)
    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.CREATED,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { emailId, mobileNo, password } = req.body;
    const result = await authService.login(emailId, mobileNo, password, res);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.UNAUTHORIZED,
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

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(res);

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};
