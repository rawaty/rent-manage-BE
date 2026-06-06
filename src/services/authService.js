const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Check for existing user BEFORE hashing to avoid wasted CPU
exports.register = async (payload) => {
  const existing = await User.findOne({
    $or: [{ emailId: payload.emailId }, { mobileNo: payload.mobileNo }],
  });

  if (existing) {
    return { success: false, message: "User already registered" };
  }

  const hashed = await bcrypt.hash(payload.password, 10);

  await User.create({
    ...payload,
    password: hashed,
    isProfileComplete: false,
  });

  return { success: true, message: "Signed up successfully" };
};

exports.login = async (email, mobileNo, password, res) => {
  const user = await User.findOne({
    $or: [{ emailId: email }, { mobileNo: mobileNo }],
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return { success: false, message: "Invalid credentials" };
  }

  // Use exports.* directly — no circular self-require needed
  const token = exports.generateToken(user);
  exports.setAuthCookie(res, token);
  const data = exports.buildAuthResponse(user, token);

  return { success: true, message: "Logged in successfully", data };
};

exports.generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

exports.setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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

exports.logout = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};
