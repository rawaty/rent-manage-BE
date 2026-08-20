const STATUS = require("../utils/statusCode");
const landlordProfileService = require("../services/landlordProfileService");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.createLandlordProfile = async (req, res, next) => {
  try {
    const result = await landlordProfileService.createLandlordProfile(req.body);

    if (result && !result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.CREATED,
      message: "Landlord profile created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfileData = async (req, res, next) => {
  try {
    const userId = req.params?.id;

    if (!userId) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: "userId is required",
      });
    }

    const result = await landlordProfileService.getProfileData(userId);

    if (!result || !result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result?.message || "Profile not found",
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Profile fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

// multipart/form-data carries objects as JSON strings — a malformed one is a
// client error (400), not an unhandled 500.
const parseJsonField = (raw, field) => {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    const err = new Error(`${field} must be a valid JSON string`);
    err.status = 400;
    throw err;
  }
};

exports.updateLandlordProfile = async (req, res, next) => {
  try {
    const result = await landlordProfileService.updateLandlordProfile({
      userId: req.user.id,
      userData: parseJsonField(req.body.userData, "userData"),
      landlordData: parseJsonField(req.body.landlordData, "landlordData"),
      bankData: parseJsonField(req.body.bankData, "bankData"),
      file: req.files?.profileImage?.[0],
      documents: req.files?.documents || [],
    });

    if (result && !result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Profile updated successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteLandlordProfile = async (req, res, next) => {
  try {
    const result = await landlordProfileService.deleteLandlordProfile(
      req.params.id
    );

    if (!result) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: "Profile not found",
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Profile deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
