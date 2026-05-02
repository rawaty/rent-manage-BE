const BankDetails = require("../models/BankDetails");
exports.createBankDetails = async (payload) => {
  try {
    const existing = await BankDetails.findOne({
      userId: payload.userId,
    });

    if (existing) {
      return { success: false, message: "BankDetails already exist" };
    }
    const bankdetails = await BankDetails.create(payload);

    return bankdetails;
  } catch (err) {
    throw err;
  }
};
