const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Access tokens stay short-lived; the refresh token is what keeps a session alive.
const ACCESS_TOKEN_TTL = "15m";
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const REFRESH_SECRET = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

// The SPA is served from a different origin than the API (vercel.app → onrender.com),
// so cookies must be SameSite=None + Secure in production or the browser drops them.
const cookieOptions = (maxAgeSeconds) => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: maxAgeSeconds * 1000,
    path: "/",
  };
};

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
  const refreshToken = exports.generateRefreshToken(user);
  exports.setAuthCookie(res, token, refreshToken);
  const data = exports.buildAuthResponse(user, token, refreshToken);

  return { success: true, message: "Logged in successfully", data };
};

exports.generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
};

exports.generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id, type: "refresh" }, REFRESH_SECRET(), {
    expiresIn: REFRESH_TOKEN_TTL,
  });
};

exports.setAuthCookie = (res, token, refreshToken) => {
  res.cookie("token", token, cookieOptions(ACCESS_TOKEN_TTL_SECONDS));

  if (refreshToken) {
    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions(REFRESH_TOKEN_TTL_SECONDS)
    );
  }
};

/**
 * Exchange a valid refresh token for a fresh access token.
 * The token is read from the httpOnly cookie when available and falls back to
 * the request body, because cross-site cookies are unreliable in some browsers.
 */
exports.refresh = async (refreshToken, res) => {
  if (!refreshToken) {
    return { success: false, message: "No refresh token provided" };
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET());
  } catch {
    return { success: false, message: "Invalid or expired refresh token" };
  }

  if (decoded.type !== "refresh") {
    return { success: false, message: "Invalid refresh token" };
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  const token = exports.generateToken(user);
  exports.setAuthCookie(res, token);

  return {
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken: token,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  };
};

exports.buildAuthResponse = (user, token, refreshToken) => {
  return {
    user: {
      id: user._id,
      name: user.name,
      emailId: user.emailId,
      mobileNo: user.mobileNo,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken || undefined,
      // The client uses this to size its own cookie/session timer.
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  };
};

exports.logout = (res) => {
  const clearOptions = { ...cookieOptions(0) };
  delete clearOptions.maxAge;

  res.clearCookie("token", clearOptions);
  res.clearCookie("refreshToken", clearOptions);
};
