const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    emailId: {
      type: String,
      lowercase: true,
      trim: true,
    },

    mobileNo: {
      type: String,
    },

    addressProof: {
      type: String,
    },

    documents: {
      type: [String],
      enum: ["DRIVING_LICENSE", "PASSPORT", "AADHAAR"],
      default: [],
    },

    rent: {
      type: Number,
      required: true,
    },

    moveInDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "VACATED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
