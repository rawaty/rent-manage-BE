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
      enum: ["OWNER", "MANAGER", "ADMIN"],
      default: "Owner",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
