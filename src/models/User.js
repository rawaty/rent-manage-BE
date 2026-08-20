const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      unique: true,
    },
    emailId: {
      type: String,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      // PG_OWNER is offered on the registration form — without it every PG
      // owner signup failed Mongoose validation.
      enum: ["OWNER", "MANAGER", "PG_OWNER", "ADMIN"],
      default: "OWNER",
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
