const statusCode = require("../utils/statusCode");
const bankService = require("../services/bankDetailsService");

exports.createBankDetails = async (req, res) => {
  try {
    const bank = await bankService.createBankDetails(req.body);

    res.status(statusCode.CREATED).json({
      success: true,
      data: bank,
    });
    await bank.save();
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};
