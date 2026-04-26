const mongoose = require("mongoose");

const landlordProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    state: {
      type: String,
    },
    preferredLanguage: {
      type: String,
      default: "English",
    },
    profilePhoto: {
      type: String,
    },
    panNo: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LandlordProfile", landlordProfileSchema);
