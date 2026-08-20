const applicationService = require("../services/applicationService");
const STATUS = require("../utils/statusCode");
const { sendSuccess, sendError } = require("../utils/sendResponse");

// ─── Landlord: invite a prospect ──────────────────────────────────────────────
exports.createInvite = async (req, res, next) => {
  try {
    const result = await applicationService.createInvite(
      req.params.enquiryId,
      req.user.id
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

// ─── Public: tokenised form ───────────────────────────────────────────────────
exports.getByToken = async (req, res, next) => {
  try {
    const result = await applicationService.getByToken(req.params.token);

    if (!result.success) {
      return sendError(res, {
        status: STATUS.NOT_FOUND,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Application form fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.submitByToken = async (req, res, next) => {
  try {
    const result = await applicationService.submitByToken(
      req.params.token,
      req.body,
      req.files
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, { status: STATUS.OK, message: result.message });
  } catch (err) {
    next(err);
  }
};

// ─── Landlord: fill the form on the tenant's behalf ───────────────────────────
exports.createByLandlord = async (req, res, next) => {
  try {
    const result = await applicationService.createByLandlord(
      req.user.id,
      req.body,
      req.files
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

// ─── Landlord: review ─────────────────────────────────────────────────────────
exports.listApplications = async (req, res, next) => {
  try {
    const result = await applicationService.listApplications(
      req.user.id,
      req.query
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, {
      status: STATUS.OK,
      message: "Applications fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getApplication = async (req, res, next) => {
  try {
    const result = await applicationService.getApplication(
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
      message: "Application fetched successfully",
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptApplication = async (req, res, next) => {
  try {
    const result = await applicationService.acceptApplication(
      req.params.id,
      req.user.id,
      req.body || {}
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

exports.rejectApplication = async (req, res, next) => {
  try {
    const result = await applicationService.rejectApplication(
      req.params.id,
      req.user.id,
      req.body?.reason
    );

    if (!result.success) {
      return sendError(res, {
        status: STATUS.BAD_REQUEST,
        message: result.message,
      });
    }

    return sendSuccess(res, { status: STATUS.OK, message: result.message });
  } catch (err) {
    next(err);
  }
};
