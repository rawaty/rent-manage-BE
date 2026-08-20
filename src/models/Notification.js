const mongoose = require("mongoose");

/**
 * In-app notification for a landlord.
 *
 * Tenant-facing messages go out over SMS instead (see smsService) because
 * prospects have no account on the platform.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "ENQUIRY_RECEIVED",
        "APPLICATION_SUBMITTED",
        "TENANT_ASSIGNED",
        "TENANT_VACATED",
        "COMPLIANCE_REMINDER",
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Deep-link target so the UI can route straight to the relevant record
    entityType: {
      type: String,
      enum: ["ENQUIRY", "APPLICATION", "TENANT", "PROPERTY"],
    },
    entityId: mongoose.Schema.Types.ObjectId,

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
