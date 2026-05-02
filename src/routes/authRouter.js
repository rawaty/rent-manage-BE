const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");
const { validate } = require("../middlewares/validate");
const {
  loginEmailOrMobileSchema,
  register,
} = require("../validators/authValidator");
router.post("/register", userController.register);
router.post("/login", validate(loginEmailOrMobileSchema), userController.login);
router.post("/logout", userController.logout);

module.exports = router;
