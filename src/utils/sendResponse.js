/**
 * Standard API response helper
 *
 * Success envelope:
 *   { success: true, message: String, data: Any }
 *
 * Error envelope:
 *   { success: false, message: String, errors: Array|null }
 */

const STATUS = require("./statusCode");

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {*}      options.data     - Payload to return (default: null)
 * @param {string} options.message  - Human-readable message
 * @param {number} options.status   - HTTP status code (default: 200)
 */
exports.sendSuccess = (
  res,
  { data = null, message = "Success", status = STATUS.OK } = {}
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {object}       options
 * @param {string}       options.message  - Human-readable error message
 * @param {number}       options.status   - HTTP status code (default: 500)
 * @param {Array|null}   options.errors   - Optional field-level error details
 */
exports.sendError = (
  res,
  {
    message = "Internal server error",
    status = STATUS.INTERNAL_SERVER_ERROR,
    errors = null,
  } = {}
) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
};
