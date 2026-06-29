const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const Property = require("../models/Property");
const { filterField } = require("../utils/filtereField");
const CONSTANT = require("../utils/constants");
const uploadService = require("./uploadService");

exports.onBoardTenant = async (payload) => {
  // files come from req.files (multer), body fields from req.body
  const { addressProofFile, documentFile, ...bodyData } = payload;

  const filteredData = filterField(bodyData, CONSTANT.TENANT_ALLOWED_FIELDS);

  // multipart/form-data sends arrays as JSON strings — parse before validation
  if (typeof filteredData.documents === "string") {
    try {
      filteredData.documents = JSON.parse(filteredData.documents);
    } catch {
      return {
        success: false,
        message: 'documents must be a valid JSON array e.g. ["AADHAAR"]',
      };
    }
  }

  if (!filteredData.propertyId) {
    return { success: false, message: "propertyId is required" };
  }

  if (!mongoose.Types.ObjectId.isValid(filteredData.propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  const session = await mongoose.startSession();
  const uploadedIds = [];

  try {
    // Upload address proof (image or PDF)
    if (addressProofFile) {
      const uploaded = await uploadService.uploadSingle(
        addressProofFile,
        "addressProof"
      );
      uploadedIds.push(uploaded.public_id);
      filteredData.addressProof = {
        url: uploaded.url,
        publicId: uploaded.public_id,
      };
    }

    // Upload document file (image or PDF)
    if (documentFile) {
      const uploaded = await uploadService.uploadSingle(
        documentFile,
        "tenantDocuments"
      );
      uploadedIds.push(uploaded.public_id);
      filteredData.documentFile = {
        url: uploaded.url,
        publicId: uploaded.public_id,
      };
    }

    session.startTransaction();

    // Property.exists() second arg is projection, not options — use findOne for session support
    const propertyExists = await Property.findOne(
      { _id: filteredData.propertyId },
      "_id",
      { session }
    );
    if (!propertyExists) {
      await session.abortTransaction();
      session.endSession();
      if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
      return { success: false, message: "Property not found" };
    }

    const existingTenant = await Tenant.findOne(
      { mobileNo: filteredData.mobileNo },
      null,
      { session }
    );
    if (existingTenant) {
      await session.abortTransaction();
      session.endSession();
      if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
      return {
        success: false,
        message: "Tenant with this mobile number already exists",
      };
    }

    // $inc treats missing field as 0, so this works for both new and existing documents
    const updatedProperty = await Property.findByIdAndUpdate(
      filteredData.propertyId,
      { $inc: { tenantCount: 1 } },
      { returnDocument: "after", session }
    );

    const tenant = new Tenant(filteredData);
    await tenant.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      data: { tenant, tenantCount: updatedProperty.tenantCount },
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    // Rollback any Cloudinary uploads on DB failure
    if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
    throw err;
  }
};

exports.deleteTenant = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid id format" };
  }

  const tenant = await Tenant.findByIdAndDelete(id);
  if (!tenant) {
    return { success: false, message: "Tenant not found" };
  }

  // Decrement tenantCount on the associated property
  await Property.findByIdAndUpdate(tenant.propertyId, {
    $inc: { tenantCount: -1 },
  });

  // Clean up uploaded files from Cloudinary
  const toDelete = [
    tenant.addressProof?.publicId,
    tenant.documentFile?.publicId,
  ].filter(Boolean);

  if (toDelete.length) await uploadService.deleteMultiple(toDelete);

  return { success: true };
};
