const jwt = require("jsonwebtoken");
const STATUS = require("../utils/statusCode");
const { sendError } = require("../utils/sendResponse");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, {
        status: STATUS.UNAUTHORIZED,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, {
      status: STATUS.UNAUTHORIZED,
      message: "Invalid or expired token",
    });
  }
};
