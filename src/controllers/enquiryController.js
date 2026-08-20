const enquiryService = require("../services/enquiryService");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

// ─── Public ───────────────────────────────────────────────────────────────────
exports.getPublicProperty = async (req, res, next) => {
  try {
    const result = await enquiryService.getPublicProperty(req.params.publicId);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Property fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.createEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.createEnquiry(
      req.params.publicId,
      req.body
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.CREATED,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Landlord ─────────────────────────────────────────────────────────────────
exports.listEnquiries = async (req, res, next) => {
  try {
    const result = await enquiryService.listEnquiries(req.user.id, req.query);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Enquiries fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.getEnquiry(req.params.id, req.user.id);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Enquiry fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const result = await enquiryService.updateStatus(
      req.params.id,
      req.user.id,
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
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.deleteEnquiry(
      req.params.id,
      req.user.id
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, { status: STATUS.OK, message: result.message });
  } catch (err) {
    next(err);
  }
};
