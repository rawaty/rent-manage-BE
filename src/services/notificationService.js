const Notification = require("../models/Notification");

/**
 * In-app notifications for landlords. Never throws into the caller's flow —
 * failing to record a notification must not roll back the business action
 * that triggered it.
 */
exports.notify = async ({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
  session,
}) => {
  try {
    const docs = await Notification.create(
      [{ userId, type, title, message, entityType, entityId }],
      session ? { session } : undefined
    );
    return docs[0];
  } catch (err) {
    console.error("[notification] failed to record:", err.message);
    return null;
  }
};

exports.list = async (userId, { unreadOnly = false, limit = 30 } = {}) => {
  const filter = { userId };
  if (unreadOnly) filter.isRead = false;

  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(Number(limit) || 30),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { success: true, data: { items, unreadCount } };
};

exports.markRead = async (id, userId) => {
  const updated = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isRead: true, readAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!updated) return { success: false, message: "Notification not found" };
  return { success: true, data: updated };
};

exports.markAllRead = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return { success: true };
};
