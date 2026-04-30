const BankDetails = require("../models/BankDetails");
const LandlordProfile = require("../models/LandlordProfile");
const CONSTANT = require("../utils/constants");
const { filterField } = require("../utils/filtereField");

const mongoose = require("mongoose");

exports.createLandlordProfile = async (payload) => {
  try {
    const existing = await LandlordProfile.findOne({
      userId: payload.userId,
    });
    if (existing) {
      throw new Error("Landlord profile is already in database");
    }

    return await LandlordProfile.create(payload);
  } catch (err) {
    throw err;
  }
};
exports.getProfileData = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const [profileData, bank] = await Promise.all([
      LandlordProfile.findOne({ userId: objectUserId }),
      BankDetails.findOne({ userId: objectUserId }),
    ]);
    return { profileData: profileData || null, bank: bank || null };
  } catch (err) {
    throw err;
  }
};

exports.deleteLandlordProfile = async (id) => {
  try {
    const landlordProfile = await LandlordProfile.findByIdAndDelete(id);
    if (!landlordProfile) {
      throw new Error("Landlord profile not found");
    }
    await BankDetails.deleteMany({
      userId: landlordProfile.userId,
    });
    return landlordProfile;
  } catch (err) {
    throw err;
  }
};

exports.updateLandlordProfile = async (payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, landlordData, bankData } = payload;
    const filteredLandlordData = filterField(
      landlordData,
      CONSTANT.LANDLORD_ALLOWED_FIELDS
    );
    const filteredBankData = filterField(
      bankData,
      CONSTANT.BANK_ALLOWED_FIELDS
    );
    let landlord, bank;

    if (landlordData && Object.keys(landlordData).length > 0) {
      landlord = await LandlordProfile.findOneAndUpdate(
        { userId: userId },
        {
          $set: filteredLandlordData,
        },
        { returnDocument: "after", session, runValidators: true }
      );
      if (!landlord) {
        throw new Error("Landlord not found..");
      }
    }

    //update bankDetails
    if (bankData && Object.keys(bankData).length > 0) {
      bank = await BankDetails.findOneAndUpdate(
        { userId: userId },
        {
          $set: filteredBankData,
        },
        { returnDocument: "after", session, runValidators: true }
      );
      if (!bank) {
        throw new Error("Bank not found");
      }
    }
    await session.commitTransaction();
    session.endSession();
    return { landlord, bank };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};
