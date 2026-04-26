const mongoose = require("mongoose");
const bankDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankDetails", bankDetailsSchema);
