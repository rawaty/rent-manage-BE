const tenantService = require("../services/tenantService");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

exports.onBoardTenant = async (req, res, next) => {
  try {
    // Multer puts files in req.files keyed by field name
    // Pass them alongside body fields so the service can upload them
    const payload = {
      ...req.body,
      addressProofFile: req.files?.addressProof?.[0] || null,
      // accept both "document" and "documentFile" field names
      documentFile: req.files?.documentFile?.[0] || req.files?.document?.[0] || null,
    };

    const result = await tenantService.onBoardTenant(payload);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.CREATED,
      message: "Tenant onboarded successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    const result = await tenantService.deleteTenant(req.params.id);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Tenant deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
