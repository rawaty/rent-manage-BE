const statusCode = require("../utils/statusCode");
const bankService = require("../services/bankDetailsService");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.createBankDetails = async (req, res, next) => {
  try {
    const bank = await bankService.createBankDetails(req.body);

    if (bank && !bank.success) {
      return sendError(res, {
        status: statusCode.BAD_REQUEST,
        message: bank.message,
      });
    }

    return sendSuccess(res, {
      status: statusCode.CREATED,
      message: "Bank details saved successfully",
      data: bank,
    });
  } catch (err) {
    next(err);
  }
};
