const mongoose = require("mongoose");
const crypto = require("crypto");

const TenantApplication = require("../models/TenantApplication");
const Enquiry = require("../models/Enquiry");
const Property = require("../models/Property");
const Tenant = require("../models/Tenant");
const LandlordProfile = require("../models/LandlordProfile");

const CONSTANT = require("../utils/constants");
const { filterField } = require("../utils/filtereField");
const compliance = require("../utils/compliance");
const uploadService = require("./uploadService");
const notificationService = require("./notificationService");
const smsService = require("./smsService");
const { buildAppLink, UNRESOLVED_MESSAGE } = require("../utils/appUrl");

const MOBILE_REGEX = /^[6-9]\d{9}$/;

const hashToken = (raw) =>
  crypto.createHash("sha256").update(String(raw)).digest("hex");

/**
 * Upload whichever documents were attached and merge them into the update.
 * Returns the Cloudinary ids so the caller can roll back on DB failure.
 */
const attachFiles = async (files, target) => {
  const uploadedIds = [];
  if (!files) return uploadedIds;

  const map = [
    ["idDocument", "tenantDocuments"],
    ["photograph", "tenantPhotos"],
    ["addressProof", "addressProof"],
  ];

  for (const [field, folder] of map) {
    const file = files[field]?.[0];
    if (!file) continue;

    const uploaded = await uploadService.uploadSingle(file, folder);
    uploadedIds.push(uploaded.public_id);
    target[field] = { url: uploaded.url, publicId: uploaded.public_id };
  }

  return uploadedIds;
};

/**
 * Normalise and validate the applicant-supplied payload.
 * Identity numbers are masked here so a raw Aadhaar never reaches the database.
 */
const prepareApplicationData = (payload) => {
  const data = filterField(payload, CONSTANT.APPLICATION_ALLOWED_FIELDS);

  // multipart/form-data sends everything as strings
  if (typeof data.coOccupants === "string") {
    try {
      data.coOccupants = JSON.parse(data.coOccupants);
    } catch {
      return { error: "coOccupants must be a valid JSON array" };
    }
  }

  ["monthlyIncome", "proposedRent", "securityDeposit", "tenancyMonths", "noticePeriodDays", "lockInMonths"].forEach(
    (field) => {
      if (data[field] !== undefined && data[field] !== "") {
        const n = Number(data[field]);
        if (Number.isNaN(n)) return;
        data[field] = n;
      } else {
        delete data[field];
      }
    }
  );

  if (data.consentGiven !== undefined) {
    data.consentGiven =
      data.consentGiven === true || data.consentGiven === "true";
  }

  if (data.mobileNo && !MOBILE_REGEX.test(String(data.mobileNo).trim())) {
    return { error: "Enter a valid 10-digit mobile number" };
  }

  if (data.idNumber) {
    if (!compliance.isPlausibleId(data.idType, data.idNumber)) {
      return { error: `The ${data.idType} number does not look valid` };
    }
    // Store masked only — the raw value is discarded here and never persisted
    data.idNumberMasked = compliance.maskIdNumber(data.idNumber);
  }
  delete data.idNumber;

  return { data };
};

/** Fields a submitted application must carry before a landlord can act on it. */
const validateForSubmission = (doc) => {
  const missing = [];
  const required = [
    ["name", "Full name"],
    ["mobileNo", "Mobile number"],
    ["permanentAddress", "Permanent address"],
    ["idType", "Identity document type"],
    ["idNumberMasked", "Identity document number"],
    ["emergencyContactName", "Emergency contact name"],
    ["emergencyContactMobile", "Emergency contact mobile"],
    ["moveInDate", "Move-in date"],
  ];

  required.forEach(([field, label]) => {
    if (!doc[field]) missing.push(label);
  });

  return missing;
};

// ─── Landlord: invite a prospect to fill the form ─────────────────────────────
exports.createInvite = async (enquiryId, landlordId, req) => {
  if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
    return { success: false, message: "Invalid enquiry id" };
  }

  const enquiry = await Enquiry.findOne({ _id: enquiryId, landlordId });
  if (!enquiry) {
    return { success: false, message: "Enquiry not found or access denied" };
  }

  if (["ACCEPTED", "REJECTED", "WITHDRAWN"].includes(enquiry.status)) {
    return {
      success: false,
      message: `This enquiry is ${enquiry.status.toLowerCase()} and cannot be invited`,
    };
  }

  const property = await Property.findById(enquiry.propertyId);
  if (!property) return { success: false, message: "Property not found" };

  if (property.status === "OCCUPIED") {
    return { success: false, message: "This property is already occupied" };
  }

  const rawToken = crypto.randomBytes(32).toString("base64url");

  // Reuse the enquiry's draft application if one exists, so re-inviting does
  // not orphan a partly-filled form.
  let application = await TenantApplication.findOne({
    enquiryId: enquiry._id,
    status: "DRAFT",
  });

  const tokenFields = {
    tokenHash: hashToken(rawToken),
    tokenExpiresAt: new Date(Date.now() + CONSTANT.APPLICATION_TOKEN_TTL_MS),
    tokenUsedAt: null,
  };

  if (application) {
    Object.assign(application, tokenFields);
    await application.save();
  } else {
    application = await TenantApplication.create({
      propertyId: property._id,
      landlordId,
      enquiryId: enquiry._id,
      filledBy: "TENANT",
      name: enquiry.name,
      mobileNo: enquiry.mobileNo,
      emailId: enquiry.emailId,
      moveInDate: enquiry.preferredMoveInDate,
      proposedRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
      ...tokenFields,
    });
  }

  enquiry.status = "INVITED";
  enquiry.applicationId = application._id;

  // Built from the calling frontend (or APP_URL); refuse rather than send a
  // link the tenant cannot open.
  const link = buildAppLink(req, `/apply/${rawToken}`);
  if (!link) {
    return { success: false, message: UNRESOLVED_MESSAGE };
  }

  const sms = await smsService.sendSms(
    enquiry.mobileNo,
    `Please complete your tenant application for ${
      property.propertyName || property.area || "the property"
    }: ${link} (link valid for 7 days) — RentOK`
  );

  enquiry.notifications.push({
    type: "INVITE",
    channel: "SMS",
    delivered: sms.delivered,
  });
  await enquiry.save();

  return {
    success: true,
    message: "Application link generated",
    data: {
      applicationId: application._id,
      // Returned so the landlord can copy/WhatsApp it themselves — essential
      // while no SMS gateway is configured.
      link,
      expiresAt: application.tokenExpiresAt,
      smsDelivered: sms.delivered,
    },
  };
};

// ─── Public: open the form via the tokenised link ─────────────────────────────
exports.getByToken = async (rawToken) => {
  if (!rawToken) return { success: false, message: "Invalid link" };

  const application = await TenantApplication.findOne({
    tokenHash: hashToken(rawToken),
  });

  if (!application) {
    return { success: false, message: "This application link is not valid" };
  }

  if (application.tokenExpiresAt && application.tokenExpiresAt < new Date()) {
    return {
      success: false,
      message: "This application link has expired. Please ask the owner for a new one.",
    };
  }

  if (application.status !== "DRAFT") {
    return {
      success: false,
      message: `This application has already been ${application.status.toLowerCase()}.`,
    };
  }

  const property = await Property.findById(application.propertyId);

  return {
    success: true,
    data: {
      // Never expose internal ids to an unauthenticated holder of the link
      application: {
        name: application.name,
        mobileNo: application.mobileNo,
        emailId: application.emailId,
        moveInDate: application.moveInDate,
        proposedRent: application.proposedRent,
        securityDeposit: application.securityDeposit,
        tenancyMonths: application.tenancyMonths,
      },
      property: property
        ? {
            propertyName: property.propertyName,
            propertyType: property.propertyType,
            area: property.area,
            city: property.city,
            monthlyRent: property.monthlyRent,
            securityDeposit: property.securityDeposit,
          }
        : null,
      // DPDP: the itemised notice must be shown before any data is collected
      consentNotice: compliance.consentNotice(),
      idTypes: CONSTANT.ID_TYPES,
      expiresAt: application.tokenExpiresAt,
    },
  };
};

// ─── Public: submit the form ──────────────────────────────────────────────────
exports.submitByToken = async (rawToken, payload, files) => {
  if (!rawToken) return { success: false, message: "Invalid link" };

  const application = await TenantApplication.findOne({
    tokenHash: hashToken(rawToken),
  });

  if (!application) {
    return { success: false, message: "This application link is not valid" };
  }

  if (application.tokenExpiresAt && application.tokenExpiresAt < new Date()) {
    return { success: false, message: "This application link has expired" };
  }

  if (application.status !== "DRAFT") {
    return { success: false, message: "This application has already been submitted" };
  }

  const { data, error } = prepareApplicationData(payload);
  if (error) return { success: false, message: error };

  if (!data.consentGiven) {
    return {
      success: false,
      message: "Please accept the data-use consent to submit your application",
    };
  }

  const uploadedIds = [];
  try {
    uploadedIds.push(...(await attachFiles(files, data)));

    Object.assign(application, data);
    application.filledBy = "TENANT";
    application.consent = {
      given: true,
      version: CONSTANT.CONSENT_VERSION,
      purposes: CONSTANT.CONSENT_PURPOSES,
      givenAt: new Date(),
      givenBy: "TENANT",
    };

    const missing = validateForSubmission(application);
    if (missing.length) {
      if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
      return {
        success: false,
        message: `Please complete: ${missing.join(", ")}`,
      };
    }

    application.status = "SUBMITTED";
    application.submittedAt = new Date();
    // Burn the token — the link is single-use once submitted
    application.tokenUsedAt = new Date();
    application.tokenHash = undefined;

    await application.save();

    await Enquiry.findByIdAndUpdate(application.enquiryId, {
      $set: { status: "APPLIED", applicationId: application._id },
    });

    await notificationService.notify({
      userId: application.landlordId,
      type: "APPLICATION_SUBMITTED",
      title: "Application received",
      message: `${application.name} submitted their tenant application.`,
      entityType: "APPLICATION",
      entityId: application._id,
    });

    return {
      success: true,
      message:
        "Application submitted. The owner will review it and get back to you.",
    };
  } catch (err) {
    if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
    throw err;
  }
};

// ─── Landlord: fill the form on the tenant's behalf ───────────────────────────
exports.createByLandlord = async (landlordId, payload, files) => {
  const { propertyId, enquiryId } = payload;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { success: false, message: "Invalid propertyId" };
  }

  const property = await Property.findOne({ _id: propertyId, userId: landlordId });
  if (!property) {
    return { success: false, message: "Property not found or access denied" };
  }

  if (property.status === "OCCUPIED") {
    return { success: false, message: "This property is already occupied" };
  }

  const { data, error } = prepareApplicationData(payload);
  if (error) return { success: false, message: error };

  if (!data.consentGiven) {
    return {
      success: false,
      message:
        "Confirm that you have the applicant's consent to record their details",
    };
  }

  const uploadedIds = [];
  try {
    uploadedIds.push(...(await attachFiles(files, data)));

    const application = new TenantApplication({
      ...data,
      propertyId: property._id,
      landlordId,
      enquiryId: mongoose.Types.ObjectId.isValid(enquiryId) ? enquiryId : undefined,
      filledBy: "LANDLORD",
      proposedRent: data.proposedRent ?? property.monthlyRent,
      securityDeposit: data.securityDeposit ?? property.securityDeposit,
      consent: {
        given: true,
        version: CONSTANT.CONSENT_VERSION,
        purposes: CONSTANT.CONSENT_PURPOSES,
        givenAt: new Date(),
        givenBy: "LANDLORD_ON_BEHALF",
      },
      status: "SUBMITTED",
      submittedAt: new Date(),
    });

    const missing = validateForSubmission(application);
    if (missing.length) {
      if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
      return { success: false, message: `Please complete: ${missing.join(", ")}` };
    }

    await application.save();

    if (application.enquiryId) {
      await Enquiry.findOneAndUpdate(
        { _id: application.enquiryId, landlordId },
        { $set: { status: "APPLIED", applicationId: application._id } }
      );
    }

    return {
      success: true,
      message: "Application recorded",
      data: application,
    };
  } catch (err) {
    if (uploadedIds.length) await uploadService.deleteMultiple(uploadedIds);
    throw err;
  }
};

// ─── Landlord: list / read ────────────────────────────────────────────────────
exports.listApplications = async (landlordId, { propertyId, status } = {}) => {
  const filter = { landlordId, status: { $ne: "DRAFT" } };

  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return { success: false, message: "Invalid propertyId" };
    }
    filter.propertyId = propertyId;
  }
  if (status) filter.status = status;

  const applications = await TenantApplication.find(filter)
    .select("-tokenHash")
    .populate("propertyId", "propertyName area city monthlyRent status")
    .sort({ createdAt: -1 });

  return { success: true, data: applications };
};

exports.getApplication = async (id, landlordId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid application id" };
  }

  const application = await TenantApplication.findOne({ _id: id, landlordId })
    .select("-tokenHash")
    .populate("propertyId", "propertyName propertyType area city monthlyRent securityDeposit status");

  if (!application) {
    return { success: false, message: "Application not found or access denied" };
  }

  const profile = await LandlordProfile.findOne({ userId: landlordId });

  // Surface the regulatory position on these terms alongside the application
  const warnings = compliance.evaluateTenancyCompliance({
    monthlyRent: application.proposedRent,
    securityDeposit: application.securityDeposit,
    tenancyMonths: application.tenancyMonths,
    propertyType: application.propertyId?.propertyType,
    landlordState: profile?.state,
    landlordHasPan: Boolean(profile?.panNo),
  });

  return { success: true, data: { application, complianceWarnings: warnings } };
};

// ─── Landlord: accept → assign the property ───────────────────────────────────
/**
 * Accepting an application is the pivot of the whole journey, so it runs in a
 * transaction: create the tenant, occupy the property, and close every other
 * open enquiry and application for it. A partial result here would double-let
 * a property, so it is all-or-nothing.
 *
 * Outbound SMS is deliberately sent *after* the commit — a failing gateway
 * must not roll back a completed assignment.
 */
exports.acceptApplication = async (id, landlordId, overrides = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid application id" };
  }

  const session = await mongoose.startSession();
  let outbound = null;

  try {
    session.startTransaction();

    const application = await TenantApplication.findOne(
      { _id: id, landlordId },
      null,
      { session }
    );

    if (!application) {
      await session.abortTransaction();
      return { success: false, message: "Application not found or access denied" };
    }

    if (application.status !== "SUBMITTED") {
      await session.abortTransaction();
      return {
        success: false,
        message: `Only a submitted application can be accepted (this one is ${application.status.toLowerCase()})`,
      };
    }

    const property = await Property.findOne(
      { _id: application.propertyId, userId: landlordId },
      null,
      { session }
    );

    if (!property) {
      await session.abortTransaction();
      return { success: false, message: "Property not found or access denied" };
    }

    if (property.status === "OCCUPIED") {
      await session.abortTransaction();
      return {
        success: false,
        message: "This property is already occupied. Vacate the current tenant first.",
      };
    }

    const monthlyRent =
      overrides.monthlyRent ?? application.proposedRent ?? property.monthlyRent;
    const securityDeposit =
      overrides.securityDeposit ?? application.securityDeposit ?? property.securityDeposit;
    const tenancyMonths = overrides.tenancyMonths ?? application.tenancyMonths ?? 11;
    const moveInDate = overrides.moveInDate
      ? new Date(overrides.moveInDate)
      : application.moveInDate;

    if (!monthlyRent) {
      await session.abortTransaction();
      return { success: false, message: "A monthly rent is required to assign the property" };
    }

    const tenancyEndDate = moveInDate
      ? new Date(new Date(moveInDate).setMonth(new Date(moveInDate).getMonth() + tenancyMonths))
      : undefined;

    const [tenant] = await Tenant.create(
      [
        {
          propertyId: property._id,
          landlordId,
          applicationId: application._id,
          name: application.name,
          emailId: application.emailId,
          mobileNo: application.mobileNo,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          fatherOrSpouseName: application.fatherOrSpouseName,
          permanentAddress: application.permanentAddress,
          currentAddress: application.currentAddress,
          occupation: application.occupation,
          employerName: application.employerName,
          monthlyIncome: application.monthlyIncome,
          idType: application.idType,
          idNumberMasked: application.idNumberMasked,
          addressProof: application.addressProof,
          photograph: application.photograph,
          documentFile: application.idDocument,
          documents: application.idType ? [application.idType] : [],
          emergencyContactName: application.emergencyContactName,
          emergencyContactRelation: application.emergencyContactRelation,
          emergencyContactMobile: application.emergencyContactMobile,
          coOccupants: application.coOccupants,
          vehicleDetails: application.vehicleDetails,
          monthlyRent,
          securityDeposit,
          moveInDate,
          tenancyMonths,
          tenancyEndDate,
          noticePeriodDays: application.noticePeriodDays ?? 30,
          lockInMonths: application.lockInMonths ?? 0,
          rentDueDay: overrides.rentDueDay ?? 5,
          // Carried over so the consent trail survives on the tenant record
          consent: application.consent,
          status: "ACTIVE",
          applicationStatus: "APPROVED",
        },
      ],
      { session }
    );

    application.status = "ACCEPTED";
    application.reviewedAt = new Date();
    await application.save({ session });

    property.status = "OCCUPIED";
    property.currentTenantId = tenant._id;
    property.tenantCount = (property.tenantCount || 0) + 1;
    // Stop new prospects arriving on a property that is no longer available
    property.isPubliclyListed = false;
    await property.save({ session });

    if (application.enquiryId) {
      await Enquiry.findByIdAndUpdate(
        application.enquiryId,
        { $set: { status: "ACCEPTED" } },
        { session }
      );
    }

    // Everyone else in the queue for this property is now out
    const losingEnquiries = await Enquiry.find(
      {
        propertyId: property._id,
        status: { $in: ["NEW", "INVITED", "APPLIED"] },
        _id: { $ne: application.enquiryId },
      },
      null,
      { session }
    );

    if (losingEnquiries.length) {
      await Enquiry.updateMany(
        { _id: { $in: losingEnquiries.map((e) => e._id) } },
        {
          $set: {
            status: "REJECTED",
            autoRejected: true,
            statusReason: "The property has been let to another applicant",
          },
        },
        { session }
      );
    }

    await TenantApplication.updateMany(
      {
        propertyId: property._id,
        status: { $in: ["DRAFT", "SUBMITTED"] },
        _id: { $ne: application._id },
      },
      {
        $set: {
          status: "REJECTED",
          reviewedAt: new Date(),
          rejectionReason: "The property has been let to another applicant",
          // Invalidate any outstanding form links for this property
          tokenHash: undefined,
        },
      },
      { session }
    );

    await session.commitTransaction();

    outbound = {
      tenant,
      property,
      losingEnquiries,
      tenancyMonths,
      monthlyRent,
      securityDeposit,
      moveInDate,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // The partial unique index on (propertyId, status:ACTIVE) is the last line
    // of defence against two assignments racing each other.
    if (err.code === 11000) {
      return {
        success: false,
        message: "This property already has an active tenant",
      };
    }
    throw err;
  }

  session.endSession();

  // ── Post-commit side effects ───────────────────────────────────────────────
  const { tenant, property, losingEnquiries } = outbound;

  const moveIn = outbound.moveInDate
    ? new Date(outbound.moveInDate).toLocaleDateString("en-IN")
    : "the agreed date";

  await smsService.sendSms(
    tenant.mobileNo,
    `Congratulations ${tenant.name}! Your application for ${
      property.propertyName || property.area || "the property"
    } has been approved. Rent: Rs.${outbound.monthlyRent}/month, Deposit: Rs.${
      outbound.securityDeposit || 0
    }, Move-in: ${moveIn}, Tenancy: ${outbound.tenancyMonths} months. The owner will contact you with next steps. — RentOK`
  );

  for (const enquiry of losingEnquiries) {
    await smsService.sendSms(
      enquiry.mobileNo,
      `Hello ${enquiry.name}, the property you enquired about at ${
        property.area || property.city || "RentOK"
      } has now been let to another applicant. Thank you for your interest — we'll let you know if it becomes available again. — RentOK`
    );
  }

  await notificationService.notify({
    userId: landlordId,
    type: "TENANT_ASSIGNED",
    title: "Tenant assigned",
    message: `${tenant.name} has been assigned to ${
      property.propertyName || property.area || "your property"
    }.${
      losingEnquiries.length
        ? ` ${losingEnquiries.length} other enquiry(s) were automatically declined.`
        : ""
    }`,
    entityType: "TENANT",
    entityId: tenant._id,
  });

  const guidance = compliance.policeVerificationGuidance(property.city);

  return {
    success: true,
    message: "Tenant assigned successfully",
    data: {
      tenant,
      autoRejectedCount: losingEnquiries.length,
      // The landlord has 24 hours and a statutory duty — say so plainly
      policeVerification: guidance,
    },
  };
};

// ─── Landlord: reject ─────────────────────────────────────────────────────────
exports.rejectApplication = async (id, landlordId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid application id" };
  }

  const application = await TenantApplication.findOne({ _id: id, landlordId });
  if (!application) {
    return { success: false, message: "Application not found or access denied" };
  }

  if (application.status === "ACCEPTED") {
    return { success: false, message: "An accepted application cannot be rejected" };
  }

  application.status = "REJECTED";
  application.reviewedAt = new Date();
  application.rejectionReason = reason;
  application.tokenHash = undefined;
  await application.save();

  if (application.enquiryId) {
    await Enquiry.findByIdAndUpdate(application.enquiryId, {
      $set: { status: "REJECTED", statusReason: reason },
    });
  }

  if (application.mobileNo) {
    await smsService.sendSms(
      application.mobileNo,
      `Hello ${application.name}, the owner is unable to proceed with your application.${
        reason ? ` Reason: ${reason}.` : ""
      } Thank you for your interest. — RentOK`
    );
  }

  return { success: true, message: "Application rejected" };
};
