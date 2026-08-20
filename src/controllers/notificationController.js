const notificationService = require("../services/notificationService");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.list = async (req, res, next) => {
  try {
    const result = await notificationService.list(req.user.id, {
      unreadOnly: req.query.unreadOnly === "true",
      limit: req.query.limit,
    });

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Notifications fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const result = await notificationService.markRead(
      req.params.id,
      req.user.id
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Notification marked as read",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "All notifications marked as read",
    });
  } catch (err) {
    next(err);
  }
};
