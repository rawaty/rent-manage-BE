const BankDetails = require("../models/BankDetails");

exports.createBankDetails = async (payload) => {
  if (!payload.userId) {
    return { success: false, message: "userId is required" };
  }

  const existing = await BankDetails.findOne({ userId: payload.userId });
  if (existing) {
    return { success: false, message: "Bank details already exist for this user" };
  }

  const bankDetails = await BankDetails.create(payload);

  return { success: true, message: "Bank details created", data: bankDetails };
};
