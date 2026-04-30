const authService = require("../services/authService");
const STATUS = require("../utils/statusCode");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);

    res.status(STATUS.CREATED).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailId, mobileNo, password } = req.body;
    const user = await authService.login(emailId, mobileNo, password);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    const data = {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.emailId,
        mobileNumber: user.mobileNo,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isProfileComplete: user.isProfileComplete,
      },
      token: {
        accessToken: token,
      },
    };
    res.status(STATUS.OK).json({
      success: true,
      data: data,
    });
  } catch (err) {
    res.status(STATUS.OK).json({
      success: true,
      data: err.message,
    });
  }
};
