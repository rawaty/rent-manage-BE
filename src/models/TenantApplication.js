const mongoose = require("mongoose");
const CONSTANT = require("../utils/constants");

const fileSchema = {
  url: String,
  publicId: String,
};

/**
 * The regulatory-compliance form for a prospective tenant.
 *
 * Fillable either by the landlord (with the tenant's consent) or by the tenant
 * themselves through a single-use tokenised link. Holds identity data, so
 * every field is covered by the itemised DPDP consent recorded below.
 */
const tenantApplicationSchema = new mongoose.Schema(
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

    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      index: true,
    },

    filledBy: {
      type: String,
      enum: ["LANDLORD", "TENANT"],
      default: "TENANT",
    },

    // ── Tenant-facing link ───────────────────────────────────────────────────
    // Only the SHA-256 hash is stored; the raw token lives in the link alone,
    // so a database leak cannot be replayed to open somebody's form.
    tokenHash: {
      type: String,
      index: true,
    },
    tokenExpiresAt: Date,
    tokenUsedAt: Date,

    // ── Applicant identity ───────────────────────────────────────────────────
    name: { type: String, trim: true },
    mobileNo: { type: String, trim: true },
    emailId: { type: String, lowercase: true, trim: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
    },
    fatherOrSpouseName: { type: String, trim: true },

    permanentAddress: { type: String, trim: true },
    currentAddress: { type: String, trim: true },

    // ── Livelihood ───────────────────────────────────────────────────────────
    occupation: { type: String, trim: true },
    employerName: { type: String, trim: true },
    employerAddress: { type: String, trim: true },
    monthlyIncome: Number,

    // ── Identity document ────────────────────────────────────────────────────
    // Aadhaar cannot be compelled by a private landlord, so idType is a free
    // choice and alternatives are always offered in the UI.
    idType: {
      type: String,
      enum: CONSTANT.ID_TYPES,
    },
    /**
     * Stored masked (e.g. "XXXXXXXX1234"). The Aadhaar Act and DPDP Rules bar
     * retaining a full Aadhaar number, so masking is applied in the service
     * before the document is written — the raw number never reaches the DB.
     */
    idNumberMasked: { type: String, trim: true },

    idDocument: fileSchema,
    photograph: fileSchema,
    addressProof: fileSchema,

    // ── Safety & references ──────────────────────────────────────────────────
    emergencyContactName: { type: String, trim: true },
    emergencyContactRelation: { type: String, trim: true },
    emergencyContactMobile: { type: String, trim: true },
    previousLandlordName: { type: String, trim: true },
    previousLandlordMobile: { type: String, trim: true },

    // People who will live with the applicant — police verification needs these
    coOccupants: [
      {
        name: { type: String, trim: true },
        relation: { type: String, trim: true },
        age: Number,
      },
    ],

    vehicleDetails: { type: String, trim: true },

    // ── Proposed tenancy terms ───────────────────────────────────────────────
    moveInDate: Date,
    tenancyMonths: { type: Number, default: 11 },
    proposedRent: Number,
    securityDeposit: Number,
    noticePeriodDays: { type: Number, default: 30 },
    lockInMonths: { type: Number, default: 0 },

    // ── DPDP consent record ──────────────────────────────────────────────────
    consent: {
      given: { type: Boolean, default: false },
      version: String,
      purposes: [String],
      givenAt: Date,
      // Who clicked accept — a landlord filling the form attests to holding
      // the tenant's consent, which is itself worth recording.
      givenBy: {
        type: String,
        enum: ["TENANT", "LANDLORD_ON_BEHALF"],
      },
    },

    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "ACCEPTED", "REJECTED"],
      default: "DRAFT",
      index: true,
    },

    submittedAt: Date,
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TenantApplication", tenantApplicationSchema);
