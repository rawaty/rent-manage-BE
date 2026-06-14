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
  MAX_ATTEMPTS: 5,
  BLOCK_TIME: 15 * 60 * 1000, //15 min
  COOLDOWN: 60 * 1000, // 60 sec
};
