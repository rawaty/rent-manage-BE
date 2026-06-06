const mongoose = require("mongoose");
const Property = require("../models/Property");
const User = require("../models/User");

exports.addProperty = async (payload) => {
  const { userId, monthlyRent } = payload;

  // Validate inputs before hitting the DB
  if (!userId) {
    return { success: false, message: "userId is required" };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid userId" };
  }

  if (monthlyRent === undefined || monthlyRent === null) {
    return { success: false, message: "monthlyRent is required" };
  }

  if (typeof monthlyRent !== "number") {
    return { success: false, message: "monthlyRent must be a number" };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  await Property.create(payload);

  return { success: true, message: "Property added successfully" };
};

exports.updateProperty = async (propertyId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  if (
    payload.monthlyRent !== undefined &&
    typeof payload.monthlyRent !== "number"
  ) {
    return { success: false, message: "monthlyRent must be a number" };
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return { success: false, message: "Property not found" };
  }

  await Property.findByIdAndUpdate(propertyId, payload, {
    runValidators: true,
  });

  return { success: true, message: "Property updated successfully" };
};

exports.deleteProperty = async (propertyId) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  const property = await Property.findByIdAndDelete(propertyId);
  if (!property) {
    return { success: false, message: "Property not found" };
  }

  return { success: true, message: "Property deleted successfully" };
};

exports.getProperties = async (userId) => {
  if (!userId) {
    return { success: false, message: "userId is required" };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid userId" };
  }

  const properties = await Property.find({ userId });

  return { success: true, data: properties };
};
