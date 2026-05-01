const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (payload) => {
  try {
    const hashed = await bcrypt.hash(payload.password, 10);
    const existing = await User.findOne({
      $or: [{ emailId: payload.emailId }, { mobileNo: payload.mobileNo }],
    });
    if (existing) {
      throw new Error("User is already Registered...");
    }
    const user = await User.create({ ...payload, password: hashed });
    return user;
  } catch (err) {
    throw err;
  }
};

exports.login = async (email, mobileNo, password) => {
  const user = await User.findOne({
    $or: [{ emailId: email }, { mobileNo: mobileNo }],
  });
  if (!user) {
    throw new Error("user not found..");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid password..");
  }

  return user;
};

exports.generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
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
  console.log("user", user);
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
