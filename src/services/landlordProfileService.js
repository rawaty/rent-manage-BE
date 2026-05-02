const BankDetails = require("../models/BankDetails");
const LandlordProfile = require("../models/LandlordProfile");
const CONSTANT = require("../utils/constants");
const { filterField } = require("../utils/filtereField");
const User = require("../models/User");

const mongoose = require("mongoose");

exports.createLandlordProfile = async (payload) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return { success: false, message: "Invalid ID format" };
    }
    const user = await User.findById(payload.userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const existing = await LandlordProfile.findOne({
      userId: payload.userId,
    });

    if (existing) {
      return {
        success: false,
        message: "Landlord profile already exists",
      };
    }

    const profile = await LandlordProfile.create(payload);

    return {
      success: true,
      message: "Landlord profile created successfully",
      data: profile,
    };
  } catch (err) {
    throw err;
  }
};
exports.getProfileData = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid userId",
      };
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
      return { success: false, message: "Landlord profile not found" };
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
        return {
          success: false,
          message: "Landlord not found..",
        };
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
        return {
          success: false,
          message: "Bank not found",
        };
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
