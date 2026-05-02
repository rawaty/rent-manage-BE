const STATUS = require("../utils/statusCode");

exports.validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
