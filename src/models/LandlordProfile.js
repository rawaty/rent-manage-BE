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
    profileImage: {
      url: String,
      public_id: String,
    },
    // KYC documents uploaded by the landlord. Without this field Mongoose's
    // strict mode silently discarded every uploaded document.
    documents: [
      {
        url: String,
        public_id: String,
      },
    ],
    panNo: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LandlordProfile", landlordProfileSchema);
