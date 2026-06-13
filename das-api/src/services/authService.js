import { env } from "../config/environment.js";
import { getInheritanceChain } from "../config/roleHierarchy.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/tokens.js";
import * as userRepository from "../repository/userRepository.js";

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function serializeUser(user) {
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.passwordHash;
  delete object.resetPasswordCodeHash;
  delete object.resetPasswordExpiresAt;
  return object;
}

function phoneEmail(phone) {
  return `${phone.replace(/\D/g, "")}@phone.das.local`;
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function ensurePatientRole() {
  return userRepository.upsertRole(
    { roleName: "patient" },
    {
      roleName: "patient",
      parentRoleName: "user",
      isAbstract: false,
      inheritanceChain: getInheritanceChain("patient"),
      description: "Benh nhan dat lich online, xem lich su kham, huy/doi lich va danh gia dich vu."
    }
  );
}

export async function registerPatient(data) {
  const existing = await userRepository.findUserByPhone(data.phone);

  if (existing) {
    throw httpError("So dien thoai da duoc dang ky.", 409);
  }

  const patientRole = await ensurePatientRole();
  const user = await userRepository.createUser({
    fullName: data.fullName || `Benh nhan ${data.phone}`,
    email: phoneEmail(data.phone),
    phone: data.phone,
    gender: data.gender,
    address: data.address || undefined,
    passwordHash: await hashPassword(data.password),
    roleRef: patientRole._id,
    role: "patient"
  });
  await userRepository.createPatientProfile({
    user: user._id,
    gender: data.gender,
    address: data.address || undefined
  });

  return {
    message: "Dang ky tai khoan thanh cong. Vui long dang nhap bang so dien thoai."
  };
}

export async function login(data) {
  const user = await userRepository.findUserByPhone(data.phone);

  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw httpError("So dien thoai hoac mat khau khong dung.", 401);
  }

  if (user.status !== "active") {
    throw httpError("Tai khoan dang khong hoat dong.", 403);
  }

  return {
    user: serializeUser(user),
    token: signToken(user)
  };
}

export async function requestPasswordReset(data) {
  const user = await userRepository.findUserByPhoneWithResetFields(data.phone);
  const genericMessage = "Neu so dien thoai ton tai, he thong se tao ma xac minh de dat lai mat khau.";

  if (!user) {
    return { message: genericMessage };
  }

  const verificationCode = generateVerificationCode();
  user.resetPasswordCodeHash = await hashPassword(verificationCode);
  user.resetPasswordExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  return {
    message: genericMessage,
    verificationCode: env.NODE_ENV === "production" ? undefined : verificationCode
  };
}

export async function resetPassword(data) {
  const user = await userRepository.findUserByPhoneWithResetFields(data.phone);

  if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    throw httpError("Ma xac minh khong hop le hoac da het han.", 400);
  }

  const isValidCode = await comparePassword(data.verificationCode, user.resetPasswordCodeHash);
  if (!isValidCode) {
    throw httpError("Ma xac minh khong hop le hoac da het han.", 400);
  }

  user.passwordHash = await hashPassword(data.newPassword);
  user.resetPasswordCodeHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return { message: "Da dat lai mat khau. Vui long dang nhap bang mat khau moi." };
}

export function getCurrentUser(user) {
  return { user: serializeUser(user) };
}

export async function updateProfile(user, data) {
  if (data.phone && data.phone !== user.phone) {
    const duplicate = await userRepository.findDuplicatePhone(data.phone, user._id);
    if (duplicate) {
      throw httpError("So dien thoai da ton tai.", 409);
    }
  }

  const update = {};
  for (const key of ["fullName", "phone", "gender", "bio"]) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  if (data.address !== undefined) update.address = data.address || undefined;
  if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl || undefined;

  const updatedUser = await userRepository.updateUserById(user._id, update);

  if (updatedUser.role === "patient" && (data.gender || data.address !== undefined)) {
    await userRepository.updatePatientProfileByUser(updatedUser._id, {
      gender: data.gender,
      address: data.address || undefined
    });
  }

  return { user: serializeUser(updatedUser) };
}

export async function getNotifications(user) {
  const notifications = await userRepository.findNotificationsByUser(user._id);
  return { notifications };
}

export async function markAllNotificationsRead(user) {
  await userRepository.markAllNotificationsRead(user._id);
  return getNotifications(user);
}

export async function markNotificationRead(user, notificationId) {
  const notification = await userRepository.markNotificationRead(user._id, notificationId);

  if (!notification) {
    throw httpError("Khong tim thay thong bao.", 404);
  }

  return { notification };
}

export async function changePassword(user, data) {
  const storedUser = await userRepository.findUserByIdWithPassword(user._id);

  if (!(await comparePassword(data.currentPassword, storedUser.passwordHash))) {
    throw httpError("Mat khau hien tai khong dung.", 400);
  }

  storedUser.passwordHash = await hashPassword(data.newPassword);
  await storedUser.save();

  return { message: "Da doi mat khau." };
}

export function logout() {
  return { message: "Da dang xuat." };
}
