module.exports = {
  LANDLORD_ALLOWED_FIELDS: [
    "state",
    "preferredLanguage",
    "profileImage",
    "documents",
    "panNo",
  ],

  // Fields on the User document the owner may edit from the profile screen
  USER_ALLOWED_FIELDS: ["name", "mobileNo", "emailId"],

  BANK_ALLOWED_FIELDS: [
    "accountHolderName",
    "accountNumber",
    "ifscCode",
    "bankName",
  ],

  PROPERTY_ALLOWED_FIELDS: [
    "propertyName",
    "propertyType",
    "street",
    "area",
    "city",
    "pinCode",
    "mapLocation",
    "noOfFloor",
    "rooms",
    "size",
    "furnishStatus",
    "facilities",
    "amenities",
    "monthlyRent",
    "securityDeposit",
    "maintenanceCharges",
    "electricityCharges",
    "meterBased",
    "propertyImages",
    "latePaymentPenalty",
  ],

  // Scalar fields from req.body allowed into Tenant document
  // File uploads (addressProof, documentFile) are handled separately in the service
  TENANT_ALLOWED_FIELDS: [
    "propertyId",
    "landlordId",
    "name",
    "emailId",
    "mobileNo",
    "documents",   // enum array e.g. ["AADHAAR", "PASSPORT"]
    "monthlyRent",
    "moveInDate",
    "status",
    "applicationStatus",
  ],

  // ── Tenant journey ─────────────────────────────────────────────────────────

  // Fields a landlord may set when creating/updating an enquiry by hand
  ENQUIRY_ALLOWED_FIELDS: [
    "name",
    "mobileNo",
    "emailId",
    "message",
    "source",
    "preferredMoveInDate",
  ],

  // Scalar fields accepted on a tenant application (files handled separately).
  // Every field here must be justifiable under DPDP data-minimisation.
  APPLICATION_ALLOWED_FIELDS: [
    // Applicant identity
    "name",
    "mobileNo",
    "emailId",
    "dateOfBirth",
    "gender",
    "fatherOrSpouseName",
    // Addresses
    "permanentAddress",
    "currentAddress",
    // Livelihood — landlords need affordability evidence
    "occupation",
    "employerName",
    "employerAddress",
    "monthlyIncome",
    // Identity document
    "idType",
    "idNumber",
    // Safety / verification
    "emergencyContactName",
    "emergencyContactRelation",
    "emergencyContactMobile",
    "previousLandlordName",
    "previousLandlordMobile",
    "coOccupants",
    "vehicleDetails",
    // Proposed tenancy terms
    "moveInDate",
    "tenancyMonths",
    "proposedRent",
    "securityDeposit",
    "noticePeriodDays",
    "lockInMonths",
    // Consent (DPDP)
    "consentGiven",
  ],

  // Fields editable on an assigned tenant
  TENANT_UPDATE_ALLOWED_FIELDS: [
    "name",
    "emailId",
    "mobileNo",
    "monthlyRent",
    "securityDeposit",
    "moveInDate",
    "noticePeriodDays",
    "lockInMonths",
    "rentDueDay",
    "status",
  ],

  ID_TYPES: ["PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "AADHAAR"],

  /**
   * DPDP Act 2023 requires a standalone, itemised notice before collecting
   * personal data. Bump the version whenever the purposes below change — the
   * version is stored against every consent so past consents stay auditable.
   */
  CONSENT_VERSION: "1.0",
  CONSENT_PURPOSES: [
    "Verifying your identity as a prospective tenant",
    "Assessing your application for the property you applied to",
    "Preparing and maintaining the rental agreement and rent records",
    "Submitting tenant particulars to the police where the law requires it",
    "Contacting you about this tenancy, including rent reminders",
  ],

  // How long a tenant-facing application link stays usable
  APPLICATION_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Model Tenancy Act 2021 caps the deposit at 2 months' rent (residential).
  // Only Assam, AP, TN and UP have adopted it, so this warns rather than blocks.
  MTA_DEPOSIT_MONTHS_RESIDENTIAL: 2,
  MTA_DEPOSIT_MONTHS_COMMERCIAL: 6,
  MTA_ADOPTED_STATES: ["ASSAM", "ANDHRA PRADESH", "TAMIL NADU", "UTTAR PRADESH"],

  // Registration Act 1908 s.17: a lease of 12 months or more must be registered
  REGISTRATION_EXEMPT_MAX_MONTHS: 11,

  // Income-tax s.194-IB: individual tenant deducts 2% TDS above this monthly rent
  TDS_194IB_MONTHLY_RENT_THRESHOLD: 50000,
  TDS_194IB_RATE_PERCENT: 2,
  // Landlord PAN is needed by the tenant for HRA once annual rent crosses this
  LANDLORD_PAN_ANNUAL_RENT_THRESHOLD: 100000,

  MAX_ATTEMPTS: 5,
  BLOCK_TIME: 15 * 60 * 1000,  // 15 min
  COOLDOWN: 60 * 1000,          // 60 sec
};
