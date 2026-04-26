const BankDetails = require("../models/BankDetails");
const LandlordProfile = require("../models/landlordProfile");

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

exports.deleteLandlordProfile = async (id) => {
  try {
    console.log("service", id);
    const landlordProfile = await LandlordProfile.findByIdAndDelete(id);
    if (!landlordProfile) {
      throw new Error("Landlord profile not found");
    }
    await BankDetails.deleteMany({
      landlordProfileId: id,
    });
    return landlordProfile;
  } catch (err) {
    throw err;
  }
};

exports.updateLandlordProfile = async (payload) => {};
