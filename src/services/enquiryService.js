const mongoose = require("mongoose");
const Enquiry = require("../models/Enquiry");
const Property = require("../models/Property");
const { filterField } = require("../utils/filtereField");
const CONSTANT = require("../utils/constants");
const notificationService = require("./notificationService");
const smsService = require("./smsService");

const MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Fields safe to expose on the public listing page.
 *
 * Deliberately omits userId, the landlord's contact details and internal ids —
 * anyone with the link can read this, so it carries only what a prospective
 * tenant needs to decide whether they are interested.
 */
const toPublicProperty = (property) => ({
  publicId: property.publicId,
  propertyName: property.propertyName,
  propertyType: property.propertyType,
  area: property.area,
  city: property.city,
  pinCode: property.pinCode,
  // Street is included: a prospect cannot evaluate a home without knowing
  // roughly where it is, and the link is unguessable and landlord-shared.
  street: property.street,
  noOfFloor: property.noOfFloor,
  rooms: property.rooms,
  size: property.size,
  furnishStatus: property.furnishStatus,
  facilities: property.facilities,
  amenities: property.amenities,
  monthlyRent: property.monthlyRent,
  securityDeposit: property.securityDeposit,
  maintenanceCharges: property.maintenanceCharges,
  electricityCharges: property.electricityCharges,
  meterBased: property.meterBased,
  propertyImages: (property.propertyImages || []).map((img) => ({
    url: img.url,
  })),
  status: property.status,
  isAvailable: property.status !== "OCCUPIED",
});

exports.getPublicProperty = async (publicId) => {
  if (!publicId) {
    return { success: false, message: "Invalid property link" };
  }

  const property = await Property.findOne({ publicId });

  if (!property || !property.isPubliclyListed) {
    return { success: false, message: "This property link is no longer active" };
  }

  return { success: true, data: toPublicProperty(property) };
};

/**
 * Records a prospect's interest from the public listing page.
 * Unauthenticated — treat every field as hostile.
 */
exports.createEnquiry = async (publicId, payload) => {
  const property = await Property.findOne({ publicId });

  if (!property || !property.isPubliclyListed) {
    return { success: false, message: "This property link is no longer active" };
  }

  if (property.status === "OCCUPIED") {
    return {
      success: false,
      message: "This property has already been let. Please contact the owner.",
    };
  }

  const data = filterField(payload, CONSTANT.ENQUIRY_ALLOWED_FIELDS);

  if (!data.name || String(data.name).trim().length < 2) {
    return { success: false, message: "Please enter your name" };
  }

  if (!MOBILE_REGEX.test(String(data.mobileNo || "").trim())) {
    return { success: false, message: "Enter a valid 10-digit mobile number" };
  }

  data.name = String(data.name).trim();
  data.mobileNo = String(data.mobileNo).trim();
  // The prospect chose the source by using the link; do not trust the body
  data.source = "SHARED_LINK";

  // Don't stack duplicate open enquiries if someone taps the button twice
  const existing = await Enquiry.findOne({
    propertyId: property._id,
    mobileNo: data.mobileNo,
    status: { $in: ["NEW", "INVITED", "APPLIED"] },
  });

  if (existing) {
    return {
      success: true,
      message: "Your interest is already registered. The owner will contact you.",
      data: { enquiryId: existing._id, duplicate: true },
    };
  }

  const enquiry = await Enquiry.create({
    ...data,
    propertyId: property._id,
    landlordId: property.userId,
  });

  await notificationService.notify({
    userId: property.userId,
    type: "ENQUIRY_RECEIVED",
    title: "New interest received",
    message: `${data.name} is interested in ${
      property.propertyName || property.area || "your property"
    }.`,
    entityType: "ENQUIRY",
    entityId: enquiry._id,
  });

  return {
    success: true,
    message: "Thanks! The owner has been notified and will contact you shortly.",
    data: { enquiryId: enquiry._id, duplicate: false },
  };
};

exports.listEnquiries = async (landlordId, { propertyId, status } = {}) => {
  const filter = { landlordId };

  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return { success: false, message: "Invalid propertyId" };
    }
    filter.propertyId = propertyId;
  }

  if (status) filter.status = status;

  const enquiries = await Enquiry.find(filter)
    .populate("propertyId", "propertyName area city monthlyRent status")
    .sort({ createdAt: -1 });

  return { success: true, data: enquiries };
};

exports.getEnquiry = async (id, landlordId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid enquiry id" };
  }

  const enquiry = await Enquiry.findOne({ _id: id, landlordId }).populate(
    "propertyId",
    "propertyName area city monthlyRent status"
  );

  if (!enquiry) {
    return { success: false, message: "Enquiry not found or access denied" };
  }

  return { success: true, data: enquiry };
};

/**
 * Landlord-driven status change (reject, withdraw, reopen).
 * ACCEPTED is not settable here — that happens only by accepting an
 * application, which also assigns the property.
 */
exports.updateStatus = async (id, landlordId, { status, statusReason }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid enquiry id" };
  }

  const allowed = ["NEW", "INVITED", "REJECTED", "WITHDRAWN"];
  if (!allowed.includes(status)) {
    return {
      success: false,
      message: `status must be one of ${allowed.join(", ")}`,
    };
  }

  const enquiry = await Enquiry.findOne({ _id: id, landlordId });
  if (!enquiry) {
    return { success: false, message: "Enquiry not found or access denied" };
  }

  if (enquiry.status === "ACCEPTED") {
    return {
      success: false,
      message: "This enquiry has already been accepted and cannot be changed",
    };
  }

  enquiry.status = status;
  if (statusReason) enquiry.statusReason = statusReason;

  if (status === "REJECTED") {
    const result = await smsService.sendSms(
      enquiry.mobileNo,
      `Regarding your interest in the property: the owner is unable to proceed with your enquiry.${
        statusReason ? ` Reason: ${statusReason}.` : ""
      } Thank you for your interest. — RentOK`
    );
    enquiry.notifications.push({
      type: "REJECTED",
      channel: "SMS",
      delivered: result.delivered,
    });
  }

  await enquiry.save();

  return { success: true, data: enquiry, message: "Enquiry updated" };
};

exports.deleteEnquiry = async (id, landlordId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid enquiry id" };
  }

  const enquiry = await Enquiry.findOneAndDelete({ _id: id, landlordId });
  if (!enquiry) {
    return { success: false, message: "Enquiry not found or access denied" };
  }

  return { success: true, message: "Enquiry deleted" };
};
