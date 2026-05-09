const { default: mongoose } = require("mongoose");
const LandlordProfile = require("../models/LandlordProfile");
const Property = require("../models/Property");

exports.addProperty = async (payload) => {
  try {
    const { userId, monthlyRent } = payload;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid userId",
      };
    }
    const objectId = new mongoose.Types.ObjectId(userId);
    const user = await LandlordProfile.findOne({ userId: objectId });
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (!payload.monthlyRent) {
      return { success: false, message: "monthlyRent is required" };
    }

    if (typeof payload.monthlyRent !== "number") {
      return { success: false, message: "monthlyRent must be a number" };
    }
    const property = await Property.create(payload);
    return {
      success: true,
      message: "Property added successfully",
    };
  } catch (err) {
    throw err;
  }
};
