import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import Role from "../models/Role.js";
import User from "../models/User.js";

export function findUserByPhone(phone, projection) {
  return User.findOne({ phone }).select(projection || "");
}

export function findActiveUserById(id) {
  return User.findById(id).select("-passwordHash");
}

export function findUserByIdWithPassword(id) {
  return User.findById(id).select("+resetPasswordCodeHash +resetPasswordExpiresAt");
}

export function findUserByPhoneWithResetFields(phone) {
  return User.findOne({ phone }).select("+resetPasswordCodeHash +resetPasswordExpiresAt");
}

export function findDuplicatePhone(phone, excludedUserId) {
  return User.findOne({ phone, _id: { $ne: excludedUserId } });
}

export function upsertRole(query, data) {
  return Role.findOneAndUpdate(query, data, { new: true, upsert: true });
}

export function createUser(data) {
  return User.create(data);
}

export function createPatientProfile(data) {
  return Patient.create(data);
}

export function updatePatientProfileByUser(userId, data) {
  return Patient.findOneAndUpdate({ user: userId }, data, { upsert: true });
}

export function updateUserById(id, data) {
  return User.findByIdAndUpdate(id, data, { new: true }).select("-passwordHash");
}

export function findNotificationsByUser(userId, limit = 50) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
}

export function markAllNotificationsRead(userId) {
  return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}

export function markNotificationRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
}
