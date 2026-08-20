const BankDetails = require("../models/BankDetails");
const LandlordProfile = require("../models/LandlordProfile");
const CONSTANT = require("../utils/constants");
const { filterField } = require("../utils/filtereField");
const User = require("../models/User");
const uploadService = require("./uploadService");
const mongoose = require("mongoose");

exports.createLandlordProfile = async (payload) => {
  if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
    return { success: false, message: "Invalid userId format" };
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  const existing = await LandlordProfile.findOne({ userId: payload.userId });
  if (existing) {
    return { success: false, message: "Landlord profile already exists" };
  }

  const profile = await LandlordProfile.create(payload);

  return { success: true, data: profile };
};

exports.getProfileData = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid userId" };
  }

  // Fetch profile and bank details in parallel — single round-trip
  const [profileData, bank] = await Promise.all([
    LandlordProfile.findOne({ userId }),
    BankDetails.findOne({ userId }),
  ]);

  if (!profileData) {
    return { success: false, message: "Landlord profile not found" };
  }

  return { success: true, data: { profileData, bank: bank || null } };
};

exports.deleteLandlordProfile = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid id format" };
  }

  const landlordProfile = await LandlordProfile.findByIdAndDelete(id);
  if (!landlordProfile) {
    return { success: false, message: "Landlord profile not found" };
  }

  // Clean up associated bank details
  await BankDetails.deleteMany({ userId: landlordProfile.userId });

  return { success: true };
};

exports.updateLandlordProfile = async (payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  // Track uploaded Cloudinary IDs for rollback on failure
  const uploadedIds = [];

  try {
    const { userId, userData, landlordData, bankData, file, documents } =
      payload;

    const filteredUserData = filterField(
      userData,
      CONSTANT.USER_ALLOWED_FIELDS
    );

    const filteredLandlordData = filterField(
      landlordData,
      CONSTANT.LANDLORD_ALLOWED_FIELDS
    );

    const filteredBankData = filterField(
      bankData,
      CONSTANT.BANK_ALLOWED_FIELDS
    );

    const landlordDoc = await LandlordProfile.findOne({ userId }).session(session);
    const oldProfileImageId = landlordDoc?.profileImage?.public_id;

    // Upload new profile image
    if (file) {
      const image = await uploadService.uploadSingle(file, "profile");
      uploadedIds.push(image.public_id);
      filteredLandlordData.profileImage = image;
    }

    // Upload documents
    if (documents && documents.length) {
      const docs = await uploadService.uploadMultiple(documents, "documents");
      uploadedIds.push(...docs.map((d) => d.public_id));
      filteredLandlordData.documents = docs;
    }

    // Update the base User record (name / mobile / email)
    let updatedUser = null;
    if (Object.keys(filteredUserData).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUserData },
        { returnDocument: "after", session, runValidators: true }
      );
    }

    // Update landlord profile
    let updatedLandlord = landlordDoc;
    if (Object.keys(filteredLandlordData).length > 0) {
      updatedLandlord = await LandlordProfile.findOneAndUpdate(
        { userId },
        { $set: filteredLandlordData },
        { returnDocument: "after", session, runValidators: true, upsert: true }
      );
    }

    // Update bank details
    let updatedBank = null;
    if (bankData && Object.keys(filteredBankData).length > 0) {
      updatedBank = await BankDetails.findOneAndUpdate(
        { userId },
        { $set: filteredBankData },
        { returnDocument: "after", session, runValidators: true, upsert: true }
      );
    }

    // Delete old profile image only after successful DB writes
    if (file && oldProfileImageId) {
      await uploadService.deleteFile(oldProfileImageId);
    }

    await session.commitTransaction();
    session.endSession();

    // updatedLandlord is null when the caller only touched bank/user data and
    // no profile document exists yet — guard before calling toObject().
    return {
      success: true,
      data: {
        user: updatedUser
          ? filterField(updatedUser.toObject(), CONSTANT.USER_ALLOWED_FIELDS)
          : null,
        profile: updatedLandlord
          ? filterField(
              updatedLandlord.toObject(),
              CONSTANT.LANDLORD_ALLOWED_FIELDS
            )
          : null,
        bankDetails: updatedBank
          ? filterField(updatedBank.toObject(), CONSTANT.BANK_ALLOWED_FIELDS)
          : null,
      },
    };
  } catch (err) {
    // Rollback any Cloudinary uploads before aborting the DB transaction
    if (uploadedIds.length) {
      await uploadService.deleteMultiple(uploadedIds);
    }

    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};
