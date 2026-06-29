module.exports = {
  LANDLORD_ALLOWED_FIELDS: [
    "state",
    "preferredLanguage",
    "profileImage",
    "panNo",
  ],

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

  MAX_ATTEMPTS: 5,
  BLOCK_TIME: 15 * 60 * 1000,  // 15 min
  COOLDOWN: 60 * 1000,          // 60 sec
};
