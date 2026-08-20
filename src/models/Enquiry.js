const mongoose = require("mongoose");

/**
 * A prospective tenant's "I'm Interested" on a shared property link.
 *
 * This is the entry point of the tenant journey and is created by an
 * unauthenticated visitor, so it deliberately holds only contact details —
 * no KYC. Identity data is collected later, on the application form, behind
 * an explicit DPDP consent notice.
 */
const enquirySchema = new mongoose.Schema(
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

    mobileNo: {
      type: String,
      required: true,
      trim: true,
    },

    emailId: {
      type: String,
      lowercase: true,
      trim: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    preferredMoveInDate: Date,

    source: {
      type: String,
      enum: ["SHARED_LINK", "DIRECT", "REFERRAL", "WHATSAPP", "OTHER"],
      default: "SHARED_LINK",
    },

    status: {
      type: String,
      // NEW      → landlord has not acted yet
      // INVITED  → application link sent to the prospect
      // APPLIED  → prospect (or landlord) submitted the application form
      // ACCEPTED → application approved, tenant assigned to the property
      // REJECTED → declined, or auto-declined when another applicant won
      enum: ["NEW", "INVITED", "APPLIED", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      default: "NEW",
      index: true,
    },

    // Why the enquiry was closed — shown to the landlord and sent to the prospect
    statusReason: {
      type: String,
      trim: true,
    },

    // Set when the property was let to someone else, so the UI can distinguish
    // a deliberate rejection from an automatic one.
    autoRejected: {
      type: Boolean,
      default: false,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantApplication",
    },

    // Audit trail of what we told the prospect, and whether it actually sent
    notifications: [
      {
        type: {
          type: String,
          enum: ["INVITE", "ACCEPTED", "REJECTED"],
        },
        channel: { type: String, default: "SMS" },
        delivered: { type: Boolean, default: false },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// One open enquiry per person per property; closed ones may repeat
enquirySchema.index({ propertyId: 1, mobileNo: 1, status: 1 });

module.exports = mongoose.model("Enquiry", enquirySchema);
