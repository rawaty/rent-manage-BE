const addPropertyService = require("../services/addPropertyService");
const STATUS = require("../utils/statusCode");
exports.addProperty = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      userId: req.user?.id || req.body?.userId,
    };

    if (!payload.userId) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "userId is required",
      });
    }

    if (payload.monthlyRent === undefined || payload.monthlyRent === null) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "monthlyRent is required",
      });
    }

    const addedProperty = await addPropertyService.addProperty(payload);
    res.status(STATUS.OK).json({
      success: true,
      data: addedProperty,
    });
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};
