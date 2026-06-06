const STATUS = require("../utils/statusCode");
const { sendError } = require("../utils/sendResponse");

exports.validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.context?.key || null,
      message: d.message,
    }));

    return sendError(res, {
      status: STATUS.BAD_REQUEST,
      message: "Validation failed",
      errors,
    });
  }

  next();
};
