const { default: mongoose } = require("mongoose");
const Property = require("../models/Property");
const User = require("../models/User");

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
    const user = await User.findOne(objectId);
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

exports.updateProperty = async (propertyId, payload) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return {
        success: false,
        message: "Invalid propertyId",
      };
    }
    const objectId = new mongoose.Types.ObjectId(propertyId);
    const property = await Property.findById(objectId);
    if (!property) {
      return { success: false, message: "Property not found" };
    }

    if (
      payload.monthlyRent !== undefined &&
      typeof payload.monthlyRent !== "number"
    ) {
      return { success: false, message: "monthlyRent must be a number" };
    }

    await Property.findByIdAndUpdate(objectId, payload, {
      runValidators: true,
    });
    return {
      success: true,
      message: "Property updated successfully",
    };
  } catch (err) {
    throw err;
  }
};

exports.deleteProperty = async (propertyId) => {
  try {
    const findProperty = await Property.findById(propertyId);
    if (!findProperty) {
      return {
        success: false,
        message: "Property not found",
      };
    }
    const deletedProperty = await Property.findByIdAndDelete(propertyId);
    return {
      success: true,
      message: "Property deleted successfully",
    };
  } catch (err) {
    throw err;
  }
};
