const User = require("../models/User");
const bcrypt = require("bcrypt");

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
  const { _id, name } = user;
  if (!user) {
    throw new Error("user not found..");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid password..");
  }

  return user;
};
