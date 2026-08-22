const mongoose = require("mongoose");
const Property = require("../models/Property");
const User = require("../models/User");
const { filterField } = require("../utils/filtereField");
const CONSTANT = require("../utils/constants");
const uploadService = require("./uploadService");
const { buildAppLink, UNRESOLVED_MESSAGE } = require("../utils/appUrl");

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
      // Deliberately PUBLIC: these render on the shared listing page, which
      // has no session behind it.
      const uploaded = await uploadService.uploadMultiple(
        files,
        "propertyImages",
        uploadService.VISIBILITY.PUBLIC
      );
      uploadedIds.push(...uploaded);
      filteredData.propertyImages = uploaded.map((d) => ({
        url: d.url,
        publicId: d.public_id,
        visibility: d.visibility,
        resourceType: d.resourceType,
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

exports.updateProperty = async (propertyId, payload, userId) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  if (
    payload.monthlyRent !== undefined &&
    typeof payload.monthlyRent !== "number"
  ) {
    return { success: false, message: "monthlyRent must be a number" };
  }

  // Scope the lookup to the owner so one landlord cannot edit another's property
  const property = await Property.findOne({ _id: propertyId, userId });
  if (!property) {
    return { success: false, message: "Property not found or access denied" };
  }

  const { files } = payload;
  const filteredData = filterField(payload, CONSTANT.PROPERTY_ALLOWED_FIELDS);

  const uploadedIds = [];

  try {
    if (files && files.length) {
      // Deliberately PUBLIC: these render on the shared listing page, which
      // has no session behind it.
      const uploaded = await uploadService.uploadMultiple(
        files,
        "propertyImages",
        uploadService.VISIBILITY.PUBLIC
      );
      uploadedIds.push(...uploaded);
      filteredData.propertyImages = uploaded.map((d) => ({
        url: d.url,
        publicId: d.public_id,
        visibility: d.visibility,
        resourceType: d.resourceType,
      }));
    }

    const updated = await Property.findByIdAndUpdate(
      propertyId,
      { $set: filteredData },
      { returnDocument: "after", runValidators: true }
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

  // Field is propertyImages — reading `photos` silently orphaned every image
  if (property.propertyImages?.length) {
    const ids = property.propertyImages
      .map((img) => img.publicId)
      .filter(Boolean);

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

/**
 * Return (and lazily create) the shareable public link for a property.
 *
 * Properties created before public sharing existed have no publicId, so it is
 * minted on first request rather than in a one-off migration.
 */
exports.getShareLink = async (propertyId, userId, req) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  const property = await Property.findOne({ _id: propertyId, userId });
  if (!property) {
    return { success: false, message: "Property not found or access denied" };
  }

  if (!property.publicId) {
    // The pre-save hook mints the id
    await property.save();
  }

  // Derived from the calling frontend (or APP_URL) — never a hardcoded host,
  // because this link is what the landlord sends to a prospective tenant.
  const url = buildAppLink(req, `/p/${property.publicId}`);
  if (!url) {
    return { success: false, message: UNRESOLVED_MESSAGE };
  }

  return {
    success: true,
    data: {
      publicId: property.publicId,
      url,
      isPubliclyListed: property.isPubliclyListed,
      status: property.status,
    },
  };
};

/** Enable or disable the public listing without destroying the link. */
exports.setListingVisibility = async (propertyId, userId, isPubliclyListed) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, userId },
    { $set: { isPubliclyListed: Boolean(isPubliclyListed) } },
    { returnDocument: "after" }
  );

  if (!property) {
    return { success: false, message: "Property not found or access denied" };
  }

  return {
    success: true,
    message: property.isPubliclyListed
      ? "Property listing is now active"
      : "Property listing has been disabled",
    data: { isPubliclyListed: property.isPubliclyListed },
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
