module.exports = {
  LANDLORD_ALLOWED_FIELDS: [
    "state",
    "preferredLanguage",
    "profilePhoto",
    "panNo",
  ],
  BANK_ALLOWED_FIELDS: [
    "accountHolderName",
    "accountNumber",
    "ifscCode",
    "bankName",
  ],
  MAX_ATTEMPTS: 5,
  BLOCK_TIME: 15 * 60 * 1000, //15 min
  COOLDOWN: 60 * 1000, // 60 sec
};
