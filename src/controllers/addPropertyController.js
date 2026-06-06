const addPropertyService = require("../services/addPropertyService");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.getProperties = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await addPropertyService.getProperties(userId);

    if (result && !result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Properties fetched successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.addProperty = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      userId: req.body?.userId,
    };

    if (!payload.userId) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: "userId is required",
      });
    }

    if (payload.monthlyRent === undefined || payload.monthlyRent === null) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: "monthlyRent is required",
      });
    }

    const result = await addPropertyService.addProperty(payload);

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

exports.updateProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const result = await addPropertyService.updateProperty(
      propertyId,
      req.body
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const result = await addPropertyService.deleteProperty(propertyId);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};
