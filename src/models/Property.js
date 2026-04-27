const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    propertyName: {
      type: String,
      trim: true,
    },

    propertyType: {
      type: String,
      enum: ["FLAT", "APARTMENT", "INDEPENDENT_HOUSE", "PG", "HOSTEL"],
      default: "FLAT",
    },

    // 📍 Address
    street: String,
    area: String,
    city: String,
    pinCode: String,
    mapLocation: String,

    // 🏢 Property details
    noOfFloor: Number,
    rooms: Number,
    size: Number, // in sq ft

    // 🛋️ Furnishing
    furnishStatus: {
      type: String,
      enum: ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"],
      default: "UNFURNISHED",
    },

    // 🏗️ Facilities
    facilities: {
      type: [String],
      enum: ["LIFT", "PARKING", "WIFI", "POWER_BACKUP"],
      default: [],
    },

    // 🧰 Amenities
    amenities: {
      type: [String],
      enum: ["AC", "FAN", "GEYSER"],
      default: [],
    },

    // 💰 Pricing
    monthlyRent: {
      type: Number,
      required: true,
    },
    securityDeposit: Number,
    maintenanceCharges: Number,
    electricityCharges: Number,

    meterBased: {
      type: Boolean,
      default: false,
    },

    latePaymentPenalty: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
