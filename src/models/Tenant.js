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
      unique: true,
      required: true,
    },

    addressProof: {
      url: { type: String },
      publicId: { type: String },
    },

    // Uploaded document file (e.g. Aadhaar scan, passport scan)
    documentFile: {
      url: { type: String },
      publicId: { type: String },
    },

    // Document type labels selected by landlord/tenant
    documents: {
      type: [String],
      enum: ["DRIVING_LICENSE", "PASSPORT", "AADHAAR"],
      default: [],
    },

    monthlyRent: {
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
    applicationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
