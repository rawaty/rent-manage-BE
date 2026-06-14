const { sendError } = require("../utils/sendResponse");
const STATUS = require("../utils/statusCode");
const multer = require("multer");

/**
 * Global Express error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  console.error("[ERROR]", err);

  // Multer file upload errors (wrong type, too many files, etc.)
  if (err instanceof multer.MulterError || err.status === 400 && err.message) {
    return sendError(res, {
      status: STATUS.BAD_REQUEST,
      message: err.message,
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, {
      status: STATUS.BAD_REQUEST,
      message: "Validation failed",
      errors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, {
      status: STATUS.BAD_REQUEST,
      message: `Duplicate value for ${field}`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, {
      status: STATUS.UNAUTHORIZED,
      message: "Invalid or expired token",
    });
  }

  // CORS error
  if (err.message && err.message.includes("CORS")) {
    return sendError(res, {
      status: 403,
      message: "Not allowed by CORS policy",
    });
  }

  // Fallback
  return sendError(res, {
    status: err.statusCode || err.status || STATUS.INTERNAL_SERVER_ERROR,
    message: err.message || "Internal server error",
  });
};
