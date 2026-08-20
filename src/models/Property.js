const mongoose = require("mongoose");
const crypto = require("crypto");

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
      enum: [
        "FLAT",
        "APARTMENT",
        "INDEPENDENT_HOUSE",
        "PG",
        "HOSTEL",
        "COMMERCIAL",
      ],
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
    propertyImages: [
      {
        url: String,
        publicId: String,
      },
    ],

    latePaymentPenalty: Number,

    // auto-incremented when a tenant is onboarded, decremented when vacated
    tenantCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 🔗 Public sharing
    // Unguessable id used in the shareable listing URL (/p/:publicId). The
    // property is only reachable by someone who has the link.
    publicId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    isPubliclyListed: {
      type: Boolean,
      default: true,
    },

    // 🏠 Occupancy — one active tenancy per property
    status: {
      type: String,
      enum: ["VACANT", "OCCUPIED"],
      default: "VACANT",
      index: true,
    },

    // The tenant currently occupying the property, if any
    currentTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
  },
  { timestamps: true }
);

// Generate the share id on first save so existing rows can be backfilled by
// simply re-saving them.
// Mongoose 9 no longer passes a `next` callback to hooks — return/async only.
propertySchema.pre("save", function () {
  if (!this.publicId) {
    this.publicId = crypto.randomBytes(9).toString("base64url"); // 12 chars
  }
});

module.exports = mongoose.model("Property", propertySchema);
