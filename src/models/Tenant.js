const mongoose = require("mongoose");
const CONSTANT = require("../utils/constants");

// `visibility` and `resourceType` record how the asset was stored so a read
// can mint the right signed URL. Absent on documents predating private uploads,
// which are genuinely public on Cloudinary.
const fileSchema = {
  url: { type: String },
  publicId: { type: String },
  visibility: { type: String, enum: ["public", "private"] },
  resourceType: { type: String },
};

/**
 * An assigned tenant — the person plus their active tenancy on a property.
 *
 * Created from an accepted TenantApplication, which is where the compliance
 * data and the DPDP consent originate. With one tenancy per property today,
 * person and tenancy live on one document; `unitId` is reserved so per-room
 * letting (PG/hostel) can be added later without a migration.
 */
const tenantSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // Reserved for a future Unit/Room layer — null means "the whole property"
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantApplication",
    },

    // Reserved: lets a tenant be given portal credentials later (payments)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
      required: true,
      trim: true,
    },

    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
    },
    fatherOrSpouseName: { type: String, trim: true },

    permanentAddress: { type: String, trim: true },
    currentAddress: { type: String, trim: true },

    occupation: { type: String, trim: true },
    employerName: { type: String, trim: true },
    monthlyIncome: Number,

    // ── Identity ─────────────────────────────────────────────────────────────
    idType: { type: String, enum: CONSTANT.ID_TYPES },
    // Masked before persistence — a full Aadhaar number is never stored
    idNumberMasked: { type: String, trim: true },

    addressProof: fileSchema,
    photograph: fileSchema,

    // Uploaded document file (e.g. Aadhaar scan, passport scan)
    documentFile: fileSchema,

    // Document type labels selected by landlord/tenant
    documents: {
      type: [String],
      enum: ["DRIVING_LICENSE", "PASSPORT", "AADHAAR", "VOTER_ID"],
      default: [],
    },

    emergencyContactName: { type: String, trim: true },
    emergencyContactRelation: { type: String, trim: true },
    emergencyContactMobile: { type: String, trim: true },

    coOccupants: [
      {
        name: { type: String, trim: true },
        relation: { type: String, trim: true },
        age: Number,
      },
    ],

    vehicleDetails: { type: String, trim: true },

    // ── Tenancy terms ────────────────────────────────────────────────────────
    monthlyRent: {
      type: Number,
      required: true,
    },

    securityDeposit: Number,

    moveInDate: {
      type: Date,
      required: true,
    },

    // Derived from moveInDate + tenancyMonths at assignment
    tenancyEndDate: Date,
    tenancyMonths: { type: Number, default: 11 },
    noticePeriodDays: { type: Number, default: 30 },
    lockInMonths: { type: Number, default: 0 },
    // Day of month rent falls due
    rentDueDay: { type: Number, min: 1, max: 28, default: 5 },

    moveOutDate: Date,

    // ── Police verification (BNS s.223 — landlord's statutory obligation) ────
    policeVerification: {
      status: {
        type: String,
        enum: ["NOT_SUBMITTED", "SUBMITTED", "VERIFIED", "REJECTED"],
        default: "NOT_SUBMITTED",
      },
      submittedAt: Date,
      referenceNo: { type: String, trim: true },
      // Delhi = Form C, Mumbai = Form 24, elsewhere via the state portal
      formType: { type: String, trim: true },
      notes: { type: String, trim: true },
    },

    // ── DPDP consent, carried over from the accepted application ─────────────
    consent: {
      given: { type: Boolean, default: false },
      version: String,
      purposes: [String],
      givenAt: Date,
      givenBy: {
        type: String,
        enum: ["TENANT", "LANDLORD_ON_BEHALF"],
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "VACATED"],
      default: "ACTIVE",
      index: true,
    },
    applicationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// A mobile number is unique per landlord, not globally: the same person may
// legitimately rent from two different landlords on the platform.
// NOTE: the old global `mobileNo_1` unique index must be dropped once:
//   db.tenants.dropIndex("mobileNo_1")
tenantSchema.index({ landlordId: 1, mobileNo: 1 }, { unique: true });

// Lookups of every tenant a property has ever had (the partial index below
// only covers active ones).
tenantSchema.index({ propertyId: 1, status: 1 });

// Enforces "one active tenancy per property" at the database level, so a race
// between two concurrent assignments cannot double-let a property.
tenantSchema.index(
  { propertyId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
    name: "one_active_tenancy_per_property",
  }
);

module.exports = mongoose.model("Tenant", tenantSchema);
