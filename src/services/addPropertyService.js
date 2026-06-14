const mongoose = require("mongoose");
const Property = require("../models/Property");
const User = require("../models/User");
const { filterField } = require("../utils/filtereField");
const CONSTANT = require("../utils/constants");
const uploadService = require("./uploadService");

exports.addProperty = async (payload) => {
  const { userId, monthlyRent, files } = payload;

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

  const filteredData = filterField(payload, CONSTANT.PROPERTY_ALLOWED_FIELDS);

  // Track uploaded IDs for rollback on DB failure
  const uploadedIds = [];

  try {
    if (files && files.length) {
      const uploaded = await uploadService.uploadMultiple(
        files,
        "propertyImages"
      );
      uploadedIds.push(...uploaded.map((d) => d.public_id));
      filteredData.propertyImages = uploaded.map((d) => ({
        url: d.url,
        publicId: d.public_id,
      }));
    }

    const property = await Property.create({ ...filteredData, userId });

    return {
      success: true,
      message: "Property added successfully",
      data: property,
    };
  } catch (err) {
    // Rollback any uploaded images if DB write fails
    if (uploadedIds.length) {
      await uploadService.deleteMultiple(uploadedIds);
    }
    throw err;
  }
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

  const { files } = payload;
  const filteredData = filterField(payload, CONSTANT.PROPERTY_ALLOWED_FIELDS);

  const uploadedIds = [];

  try {
    if (files && files.length) {
      const uploaded = await uploadService.uploadMultiple(
        files,
        "propertyImages"
      );
      uploadedIds.push(...uploaded.map((d) => d.public_id));
      filteredData.propertyImages = uploaded.map((d) => ({
        url: d.url,
        publicId: d.public_id,
      }));
    }

    const updated = await Property.findByIdAndUpdate(
      propertyId,
      { $set: filteredData },
      { new: true, runValidators: true }
    );

    // Delete old images from Cloudinary after successful DB write
    if (files && files.length && property.propertyImages?.length) {
      const oldIds = property.propertyImages
        .map((img) => img.publicId)
        .filter(Boolean);
      if (oldIds.length) {
        await uploadService.deleteMultiple(oldIds);
      }
    }

    return {
      success: true,
      message: "Property updated successfully",
      data: updated,
    };
  } catch (err) {
    // Rollback newly uploaded images if DB write fails
    if (uploadedIds.length) {
      await uploadService.deleteMultiple(uploadedIds);
    }
    throw err;
  }
};

exports.deleteProperty = async (propertyId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return {
      success: false,
      message: "Invalid propertyId",
    };
  }

  const property = await Property.findOne({
    _id: propertyId,
    userId,
  });

  if (!property) {
    return {
      success: false,
      message: "Property not found or access denied",
    };
  }

  if (property.photos?.length) {
    const ids = property.photos.map((img) => img.publicId).filter(Boolean);

    if (ids.length) {
      await uploadService.deleteMultiple(ids);
    }
  }

  await Property.findByIdAndDelete(propertyId);

  return {
    success: true,
    message: "Property deleted successfully",
  };
};

exports.getProperties = async (userId) => {
  if (!userId) {
    return { success: false, message: "userId is required" };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid userId" };
  }

  const properties = await Property.find({ userId }).sort({ createdAt: -1 });

  return { success: true, data: properties };
};
