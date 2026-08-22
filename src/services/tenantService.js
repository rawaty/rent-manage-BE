const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const Property = require("../models/Property");
const { filterField } = require("../utils/filtereField");
const CONSTANT = require("../utils/constants");
const compliance = require("../utils/compliance");
const uploadService = require("./uploadService");
const notificationService = require("./notificationService");

/**
 * Replace stored asset URLs with signed ones before a tenant record leaves the
 * server. Private assets are unreachable from their bare URL, so this is what
 * makes documents viewable — and it only ever runs after an ownership check.
 */
const withSignedAssets = (tenant) => {
  const t = typeof tenant.toObject === "function" ? tenant.toObject() : { ...tenant };

  ["addressProof", "photograph", "documentFile"].forEach((field) => {
    if (t[field]) t[field] = uploadService.withSignedUrl(t[field]);
  });

  return t;
};

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
      uploadedIds.push(uploaded);
      filteredData.addressProof = {
        url: uploaded.url,
        publicId: uploaded.public_id,
        visibility: uploaded.visibility,
        resourceType: uploaded.resourceType,
      };
    }

    // Upload document file (image or PDF)
    if (documentFile) {
      const uploaded = await uploadService.uploadSingle(
        documentFile,
        "tenantDocuments"
      );
      uploadedIds.push(uploaded);
      filteredData.documentFile = {
        url: uploaded.url,
        publicId: uploaded.public_id,
        visibility: uploaded.visibility,
        resourceType: uploaded.resourceType,
      };
    }

    session.startTransaction();

    // Property.exists() second arg is projection, not options — use findOne for session support
    const propertyExists = await Property.findOne(
      { _id: filteredData.propertyId },
      "_id status",
      { session }
    );
    if (!propertyExists) {
      await session.abortTransaction();
      session.endSession();
      if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
      return { success: false, message: "Property not found" };
    }

    // Duplicate check is scoped to the landlord — the same tenant may rent
    // from a different landlord on the platform.
    const existingTenant = await Tenant.findOne(
      {
        mobileNo: filteredData.mobileNo,
        landlordId: filteredData.landlordId,
      },
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

    if (propertyExists.status === "OCCUPIED") {
      await session.abortTransaction();
      session.endSession();
      if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
      return {
        success: false,
        message: "This property is already occupied. Vacate the current tenant first.",
      };
    }

    // $inc treats missing field as 0, so this works for both new and existing documents
    const updatedProperty = await Property.findByIdAndUpdate(
      filteredData.propertyId,
      {
        $inc: { tenantCount: 1 },
        // Keep occupancy in step with the direct-onboarding path too
        $set: { status: "OCCUPIED", isPubliclyListed: false },
      },
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

// ─── Read ─────────────────────────────────────────────────────────────────────
exports.listTenants = async (landlordId, { propertyId, status, search } = {}) => {
  const filter = { landlordId };

  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return { success: false, message: "Invalid propertyId" };
    }
    filter.propertyId = propertyId;
  }

  if (status) filter.status = status;

  if (search && String(search).trim()) {
    // Escape user input before it becomes a regex
    const safe = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { mobileNo: { $regex: safe, $options: "i" } },
      { emailId: { $regex: safe, $options: "i" } },
    ];
  }

  const tenants = await Tenant.find(filter)
    .populate("propertyId", "propertyName area city propertyType monthlyRent")
    .sort({ createdAt: -1 });

  return { success: true, data: tenants.map(withSignedAssets) };
};

exports.getTenant = async (id, landlordId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid tenant id" };
  }

  const tenant = await Tenant.findOne({ _id: id, landlordId }).populate(
    "propertyId",
    "propertyName area city propertyType monthlyRent securityDeposit status"
  );

  if (!tenant) {
    return { success: false, message: "Tenant not found or access denied" };
  }

  return {
    success: true,
    data: {
      tenant: withSignedAssets(tenant),
      policeVerification: compliance.policeVerificationGuidance(
        tenant.propertyId?.city
      ),
    },
  };
};

// ─── Update ───────────────────────────────────────────────────────────────────
exports.updateTenant = async (id, landlordId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid tenant id" };
  }

  const data = filterField(payload, CONSTANT.TENANT_UPDATE_ALLOWED_FIELDS);

  if (!Object.keys(data).length) {
    return { success: false, message: "No editable fields supplied" };
  }

  // Status changes have side effects on the property, so they go through
  // vacateTenant instead of a blind $set here.
  if (data.status) {
    return {
      success: false,
      message: "Use the vacate endpoint to change a tenant's status",
    };
  }

  ["monthlyRent", "securityDeposit", "noticePeriodDays", "lockInMonths", "rentDueDay"].forEach(
    (field) => {
      if (data[field] !== undefined) data[field] = Number(data[field]);
    }
  );

  const tenant = await Tenant.findOneAndUpdate(
    { _id: id, landlordId },
    { $set: data },
    { returnDocument: "after", runValidators: true }
  );

  if (!tenant) {
    return { success: false, message: "Tenant not found or access denied" };
  }

  return { success: true, message: "Tenant updated", data: tenant };
};

/** Record the outcome of the landlord's statutory police intimation. */
exports.updatePoliceVerification = async (id, landlordId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid tenant id" };
  }

  const allowed = ["NOT_SUBMITTED", "SUBMITTED", "VERIFIED", "REJECTED"];
  if (payload.status && !allowed.includes(payload.status)) {
    return { success: false, message: `status must be one of ${allowed.join(", ")}` };
  }

  const update = {
    "policeVerification.status": payload.status || "SUBMITTED",
    "policeVerification.referenceNo": payload.referenceNo,
    "policeVerification.formType": payload.formType,
    "policeVerification.notes": payload.notes,
  };

  if (payload.status !== "NOT_SUBMITTED") {
    update["policeVerification.submittedAt"] = new Date();
  }

  const tenant = await Tenant.findOneAndUpdate(
    { _id: id, landlordId },
    { $set: update },
    { returnDocument: "after" }
  );

  if (!tenant) {
    return { success: false, message: "Tenant not found or access denied" };
  }

  return { success: true, message: "Police verification updated", data: tenant };
};

/**
 * End a tenancy and free the property for re-letting.
 * Kept separate from delete: a vacated tenant is history worth retaining.
 */
exports.vacateTenant = async (id, landlordId, { moveOutDate } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid tenant id" };
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const tenant = await Tenant.findOne({ _id: id, landlordId }, null, { session });

    if (!tenant) {
      await session.abortTransaction();
      return { success: false, message: "Tenant not found or access denied" };
    }

    if (tenant.status === "VACATED") {
      await session.abortTransaction();
      return { success: false, message: "This tenant has already vacated" };
    }

    tenant.status = "VACATED";
    tenant.moveOutDate = moveOutDate ? new Date(moveOutDate) : new Date();
    await tenant.save({ session });

    await Property.findOneAndUpdate(
      { _id: tenant.propertyId, userId: landlordId },
      {
        $set: {
          status: "VACANT",
          currentTenantId: null,
          // Available to prospects again
          isPubliclyListed: true,
        },
        $inc: { tenantCount: -1 },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await notificationService.notify({
      userId: landlordId,
      type: "TENANT_VACATED",
      title: "Tenant vacated",
      message: `${tenant.name} has vacated. The property is available to let again.`,
      entityType: "PROPERTY",
      entityId: tenant.propertyId,
    });

    return { success: true, message: "Tenant vacated", data: tenant };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

exports.deleteTenant = async (id, landlordId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid id format" };
  }

  // Scope to the owning landlord so tenants cannot be deleted across accounts
  const tenant = await Tenant.findOneAndDelete({ _id: id, landlordId });
  if (!tenant) {
    return { success: false, message: "Tenant not found or access denied" };
  }

  // Free the property if this tenant was still occupying it, otherwise it
  // would stay OCCUPIED forever with no tenant behind it.
  const propertyUpdate = { $inc: { tenantCount: -1 } };
  if (tenant.status === "ACTIVE") {
    propertyUpdate.$set = {
      status: "VACANT",
      currentTenantId: null,
      isPubliclyListed: true,
    };
  }

  await Property.findByIdAndUpdate(tenant.propertyId, propertyUpdate);

  // Clean up uploaded files from Cloudinary
  const toDelete = [
    tenant.addressProof?.publicId,
    tenant.documentFile?.publicId,
  ].filter(Boolean);

  if (toDelete.length) await uploadService.deleteMultiple(toDelete);

  return { success: true };
};
