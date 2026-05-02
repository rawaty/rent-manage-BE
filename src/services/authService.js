const User = require("../models/User");
const bcrypt = require("bcrypt");
const authService = require("../services/authService");
const jwt = require("jsonwebtoken");

exports.register = async (payload) => {
  try {
    const hashed = await bcrypt.hash(payload.password, 10);
    const existing = await User.findOne({
      $or: [{ emailId: payload.emailId }, { mobileNo: payload.mobileNo }],
    });
    if (existing) {
      return {
        success: false,
        message: "User is already Registered...",
      };
    }
    await User.create({ ...payload, password: hashed });
    return { success: true, message: "sign up successfully" };
  } catch (err) {
    throw err;
  }
};

exports.login = async (email, mobileNo, password, res) => {
  const user = await User.findOne({
    $or: [{ emailId: email }, { mobileNo: mobileNo }],
  });
  if (!user) {
    return {
      success: false,
      message: "User not found..",
    };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return {
      success: false,
      message: "Invalid Password..",
    };
  }

  const token = authService.generateToken(user);
  authService.setAuthCookie(res, token);
  const data = authService.buildAuthResponse(user, token);

  return data;
};

exports.generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

exports.setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ important
    sameSite: "lax",
  });
};

exports.buildAuthResponse = (user, token) => {
  return {
    user: {
      id: user._id,
      name: user.name,
      emailId: user.emailId,
      mobileNo: user.mobileNo,
      role: user.role,
    },
    tokens: {
      accessToken: token,
    },
  };
};

exports.logout = async (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return "logout Successfully";
};
