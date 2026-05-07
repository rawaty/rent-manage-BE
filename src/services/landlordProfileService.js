const BankDetails = require("../models/BankDetails");
const LandlordProfile = require("../models/LandlordProfile");
const CONSTANT = require("../utils/constants");
const { filterField } = require("../utils/filtereField");
const User = require("../models/User");
const uploadService = require("./uploadService");

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

  let uploadedIds = []; // 👈 track for rollback

  try {
    const { userId, landlordData, bankData, file, documents } = payload;

    const filteredLandlordData = filterField(
      landlordData,
      CONSTANT.LANDLORD_ALLOWED_FIELDS
    );

    const filteredBankData = filterField(
      bankData,
      CONSTANT.BANK_ALLOWED_FIELDS
    );

    let landlord = await LandlordProfile.findOne({ userId }).session(session);

    if (!landlord) {
      throw new Error("Landlord not found");
    }

    // store old image before update
    const oldProfileImageId = landlord.profileImage?.public_id;

    //upload profile image
    if (file) {
      const image = await uploadService.uploadSingle(file, "profile");

      uploadedIds.push(image.public_id);

      filteredLandlordData.profileImage = image;
    }

    //upload documents
    if (documents && documents.length) {
      const docs = await uploadService.uploadMultiple(documents, "documents");

      uploadedIds.push(...docs.map((d) => d.public_id));

      filteredLandlordData.documents = docs;
    }

    //update landlord
    if (Object.keys(filteredLandlordData).length > 0) {
      landlord = await LandlordProfile.findOneAndUpdate(
        { userId },
        { $set: filteredLandlordData },
        { returnDocument: "after", session, runValidators: true }
      );
    }

    //update bank
    let bank;
    if (bankData && Object.keys(filteredBankData).length > 0) {
      bank = await BankDetails.findOneAndUpdate(
        { userId },
        { $set: filteredBankData },
        { returnDocument: "after", session, runValidators: true, upsert: true }
      );
    }

    //delete old image
    if (file && oldProfileImageId) {
      await uploadService.deleteFile(oldProfileImageId);
    }

    await session.commitTransaction();
    session.endSession();

    return { landlord, bank };
  } catch (err) {
    // 🔥 rollback uploaded files
    await uploadService.deleteMultiple(uploadedIds);

    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};
