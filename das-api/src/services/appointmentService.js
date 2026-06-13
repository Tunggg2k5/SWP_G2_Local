import * as appointmentRepository from "../repository/appointmentRepository.js";
import {
  createAppointmentFromSlot,
  rescheduleAppointmentFromSlot
} from "./schedulingService.js";
import { combineDateAndTime, endOfLocalDay, startOfLocalDay, toDateInputValue } from "../utils/time.js";
import {
  appointmentNoteSchema,
  appointmentPaymentSchema,
  cancelAppointmentSchema,
  checkInAppointmentSchema,
  createAppointmentSchema,
  receptionScheduleSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema
} from "../validations/appointmentValidation.js";

const STAFF_ROLES = new Set(["receptionist", "admin", "nurse"]);
const LOCKED_APPOINTMENT_STATUSES = new Set(["cancelled", "rejected"]);

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function appointmentQueryForUser(user) {
  if (user.role === "patient") return { patient: user._id };
  if (user.role === "dentist") return { dentist: user._id };
  if (user.role === "nurse") return { nurse: user._id };
  return {};
}

function normalizeId(value) {
  return value?._id || value;
}

function sameId(left, right) {
  return normalizeId(left)?.toString() === normalizeId(right)?.toString();
}

function canAccessAppointment(user, appointment) {
  if (["admin", "receptionist"].includes(user.role)) return true;
  if (user.role === "patient") return sameId(appointment.patient, user._id);
  if (user.role === "dentist") return sameId(appointment.dentist, user._id);
  if (user.role === "nurse") return sameId(appointment.nurse, user._id);
  return false;
}

function isPatientCancelled(appointment) {
  return appointment.status === "cancelled" && appointment.cancelledByRole === "patient";
}

function assertAppointmentCanChange(appointment, user) {
  if (isPatientCancelled(appointment)) {
    throw createError("Lịch hẹn đã do bệnh nhân hủy nên lễ tân không thể cập nhật trạng thái.", 409);
  }

  if (appointment.status === "cancelled" && !STAFF_ROLES.has(user.role)) {
    throw createError("Lịch hẹn đã hủy nên không thể cập nhật thêm.", 409);
  }

  if (LOCKED_APPOINTMENT_STATUSES.has(appointment.status)) {
    throw createError("Lịch hẹn đã hủy hoặc bị từ chối nên không thể cập nhật thêm.", 409);
  }
}

function formatClinicDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(value));
}

async function notifyPatientOfReceptionDecision(appointment, status) {
  const messages = {
    confirmed: {
      title: "Lịch hẹn đã được chấp nhận",
      message: "Lễ tân đã chấp nhận lịch hẹn của bạn. Vui lòng đến đúng giờ."
    },
    waitlisted: {
      title: "Lịch hẹn được chuyển vào hàng đợi",
      message: "Lễ tân đã chuyển lịch hẹn của bạn vào hàng đợi và sẽ liên hệ khi có slot phù hợp."
    },
    rejected: {
      title: "Lịch hẹn đã bị từ chối",
      message: "Lễ tân đã từ chối lịch hẹn này. Bạn có thể chọn slot khác và gửi lại yêu cầu."
    }
  };
  const content = messages[status];
  if (!content) return;

  await appointmentRepository.createPatientNotification({
    user: normalizeId(appointment.patient),
    title: content.title,
    message: content.message,
    isRead: false
  });
}

async function assertNotPastCheckIn(appointment) {
  const clinicCloseAt = combineDateAndTime(toDateInputValue(appointment.startAt), "17:30");
  if (
    ["pending", "scheduled", "confirmed", "waitlisted"].includes(appointment.status) &&
    !appointment.checkedInAt &&
    clinicCloseAt < new Date()
  ) {
    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = "Hệ thống tự hủy vì bệnh nhân chưa check-in trước 17:30.";
    appointment.receptionistNote = "Hệ thống tự hủy vì bệnh nhân chưa có trạng thái Có mặt trước 17:30.";
    await appointmentRepository.saveAppointment(appointment);
    throw createError("Lịch hẹn đã quá 17:30 và được hệ thống tự hủy vì bệnh nhân chưa check-in.", 409);
  }
}

function buildAppointmentQuery(user, query) {
  const appointmentQuery = appointmentQueryForUser(user);

  if (query.status) {
    appointmentQuery.status = query.status;
  }

  if (query.date) {
    appointmentQuery.startAt = {
      $gte: startOfLocalDay(query.date),
      $lte: endOfLocalDay(query.date)
    };
  }

  return appointmentQuery;
}

async function requireAccessibleAppointment(appointmentId, user, populated = false) {
  const appointment = populated
    ? await appointmentRepository.findAppointmentByIdPopulated(appointmentId)
    : await appointmentRepository.findAppointmentById(appointmentId);

  if (!appointment || !canAccessAppointment(user, appointment)) {
    throw createError("Không tìm thấy lịch hẹn.", 404);
  }

  return appointment;
}

async function ensureAppointmentInvoice(appointment) {
  let invoice = await appointmentRepository.findInvoiceByAppointment(appointment._id);
  if (invoice) return invoice;

  const price = Number(appointment.service?.price || 0);
  invoice = await appointmentRepository.createInvoice({
    appointment: appointment._id,
    patient: appointment.patient,
    items: [{ name: appointment.service?.name || "Dịch vụ nha khoa", amount: price }],
    total: price,
    totalAmount: price,
    invoiceDate: new Date(),
    status: price > 0 ? "unpaid" : "paid",
    paidAt: price > 0 ? undefined : new Date()
  });

  return invoice;
}

export function getAppointments(user, query) {
  return appointmentRepository.findAppointments(buildAppointmentQuery(user, query));
}

export function getAppointmentById(appointmentId, user) {
  return requireAccessibleAppointment(appointmentId, user, true);
}

export async function createAppointment(user, body) {
  const data = createAppointmentSchema.parse(body);

  if (!["patient", "receptionist", "admin"].includes(user.role)) {
    throw createError("Chỉ bệnh nhân, lễ tân hoặc quản trị viên được tạo lịch hẹn.", 403);
  }

  const patientId = user.role === "patient" ? user._id : data.patientId;
  if (!patientId) {
    throw createError("Cần chọn bệnh nhân khi nhân sự đặt lịch hộ.", 400);
  }

  const appointment = await createAppointmentFromSlot({
    requester: user,
    patientId,
    serviceId: data.serviceId,
    date: data.date,
    startAt: data.startAt,
    roomId: data.roomId,
    channel: user.role === "patient" ? "online" : data.channel || "offline",
    dentistPreference: data.dentistPreference,
    note: data.note
  });

  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function rescheduleAppointment(appointmentId, user, body) {
  const data = rescheduleAppointmentSchema.parse(body);
  const appointment = await requireAccessibleAppointment(appointmentId, user);

  assertAppointmentCanChange(appointment, user);
  await assertNotPastCheckIn(appointment);

  const previousStatus = appointment.status;
  const updated = await rescheduleAppointmentFromSlot({
    appointment,
    serviceId: data.serviceId,
    date: data.date,
    startAt: data.startAt,
    roomId: data.roomId
  });

  if (["pending", "rejected"].includes(previousStatus)) {
    updated.status = previousStatus;
    await appointmentRepository.saveAppointment(updated);
  }

  await appointmentRepository.populateAppointment(updated);
  return updated;
}

export async function scheduleByReception(appointmentId, user, body) {
  const data = receptionScheduleSchema.parse(body);
  const appointment = await appointmentRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  await assertNotPastCheckIn(appointment);

  const updated = await rescheduleAppointmentFromSlot({
    appointment,
    serviceId: data.serviceId,
    date: data.date,
    startAt: data.startAt,
    roomId: data.roomId
  });

  updated.status = "confirmed";
  updated.receptionist = user._id;
  updated.receptionistNote = data.note || "Lễ tân đã xếp lịch khám cho bệnh nhân.";
  await appointmentRepository.saveAppointment(updated);
  await appointmentRepository.populateAppointment(updated);

  await appointmentRepository.createPatientNotification({
    user: normalizeId(updated.patient),
    title: "Lễ tân đã xếp lịch khám",
    message: `Lịch hẹn ${updated.service?.name || "khám"} của bạn được xếp lúc ${formatClinicDateTime(updated.startAt)}. Vui lòng đến lúc ${formatClinicDateTime(updated.arrivalAt)}. Bác sĩ: ${updated.dentist?.fullName || "-"}. Phòng: ${updated.room?.name || "-"}.`,
    isRead: false
  });

  return updated;
}

export async function cancelAppointment(appointmentId, user, body) {
  const data = cancelAppointmentSchema.parse(body);
  const appointment = await requireAccessibleAppointment(appointmentId, user);

  assertAppointmentCanChange(appointment, user);
  await assertNotPastCheckIn(appointment);

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = user._id;
  appointment.cancelledByRole = user.role;
  appointment.cancellationReason = data.reason;
  await appointmentRepository.saveAppointment(appointment);

  if (appointment.appointmentSlot) {
    await appointmentRepository.updateAppointmentSlotStatus(appointment.appointmentSlot, "cancelled");
  }

  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function updateAppointmentStatus(appointmentId, user, body) {
  const data = updateAppointmentStatusSchema.parse(body);
  const appointment = await appointmentRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  await assertNotPastCheckIn(appointment);

  if (
    ["checked_in", "in_treatment", "completed"].includes(data.status) &&
    ["pending", "waitlisted", "rejected"].includes(appointment.status)
  ) {
    throw createError("Cần chấp nhận lịch hẹn trước khi cập nhật trạng thái khám.", 409);
  }

  if (
    appointment.status === "waitlisted" &&
    ["scheduled", "confirmed", "checked_in", "in_treatment", "completed"].includes(data.status)
  ) {
    throw createError("Cần đổi lịch sang slot trống trước khi xác nhận lịch hàng đợi.", 409);
  }

  const previousStatus = appointment.status;
  appointment.status = data.status;
  appointment.receptionistNote = data.note ?? appointment.receptionistNote;
  if (
    ["confirmed", "waitlisted", "rejected", "scheduled", "checked_in", "in_treatment", "completed", "cancelled", "no_show"].includes(data.status) &&
    ["receptionist", "admin"].includes(user.role)
  ) {
    appointment.receptionist = user._id;
  }
  if (data.status === "checked_in" && !appointment.checkedInAt) {
    appointment.checkedInAt = new Date();
    appointment.checkInTime = appointment.checkedInAt;
  }
  if (data.status === "cancelled" || data.status === "rejected") {
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = user._id;
    appointment.cancelledByRole = user.role;
    appointment.cancellationReason =
      data.note || (data.status === "rejected" ? "Lễ tân từ chối lịch hẹn." : appointment.cancellationReason);
  } else if (["cancelled", "rejected"].includes(previousStatus)) {
    appointment.cancelledAt = undefined;
    appointment.cancelledBy = undefined;
    appointment.cancelledByRole = undefined;
    appointment.cancellationReason = undefined;
  }

  await appointmentRepository.saveAppointment(appointment);

  if (["cancelled", "rejected", "waitlisted"].includes(data.status) && appointment.appointmentSlot) {
    await appointmentRepository.updateAppointmentSlotStatus(appointment.appointmentSlot, "cancelled");
  } else if (
    ["scheduled", "confirmed", "checked_in", "in_treatment", "completed"].includes(data.status) &&
    appointment.appointmentSlot
  ) {
    await appointmentRepository.updateAppointmentSlotStatus(appointment.appointmentSlot, "booked");
  }

  await notifyPatientOfReceptionDecision(appointment, data.status);
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function recordConfirmationCall(appointmentId, user, body) {
  const data = appointmentNoteSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentWithServiceName(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  await assertNotPastCheckIn(appointment);

  if (["completed", "waitlisted"].includes(appointment.status)) {
    throw createError("Lịch hẹn này không còn cần gọi xác nhận.", 409);
  }

  appointment.confirmationCalledAt = new Date();
  appointment.confirmationBy = user._id;
  appointment.confirmationNote = data.note || "Lễ tân đã gọi xác nhận lịch hẹn.";
  appointment.receptionist = user._id;
  if (["pending", "scheduled"].includes(appointment.status)) {
    appointment.status = "confirmed";
  }

  await appointmentRepository.saveAppointment(appointment);
  await appointmentRepository.createPatientNotification({
    user: appointment.patient,
    title: "Lịch hẹn đã được xác nhận",
    message: `Lễ tân đã gọi xác nhận lịch ${appointment.service?.name || "khám"} của bạn.`,
    isRead: false
  });
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function checkInAppointment(appointmentId, user, body) {
  const data = checkInAppointmentSchema.parse(body);
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  await assertNotPastCheckIn(appointment);

  appointment.status = "checked_in";
  appointment.checkedInAt = new Date();
  appointment.checkInTime = appointment.checkedInAt;

  let invoice = await appointmentRepository.findInvoiceByAppointment(appointment._id);
  if (!invoice) {
    invoice = await appointmentRepository.createInvoice({
      appointment: appointment._id,
      patient: appointment.patient,
      items: [{ name: appointment.service.name, amount: appointment.service.price }],
      total: appointment.service.price,
      totalAmount: appointment.service.price,
      invoiceDate: new Date(),
      status: appointment.service.price > 0 ? "unpaid" : "paid",
      paidAt: appointment.service.price > 0 ? undefined : new Date()
    });
  }

  if (data.paid || !appointment.service.requiresPrepayment) {
    appointment.paymentStatus = appointment.service.requiresPrepayment ? "paid" : "not_required";
    invoice.status = "paid";
    invoice.paidAt = new Date();
    await appointmentRepository.saveInvoice(invoice);
    await appointmentRepository.createPayment({
      invoice: invoice._id,
      amount: invoice.total,
      paymentStatus: "paid",
      paymentMethod: "cash"
    });
  }

  await appointmentRepository.saveAppointment(appointment);
  await appointmentRepository.createPatientNotification({
    user: appointment.patient,
    title: "Đã ghi nhận bệnh nhân đến",
    message: "Lịch hẹn của bạn đã được ghi nhận đến tại quầy lễ tân.",
    isRead: false
  });
  await appointmentRepository.populateAppointment(appointment);
  return { appointment, invoice };
}

export async function markNoShow(appointmentId, user, body) {
  const data = appointmentNoteSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  if (appointment.startAt > new Date()) {
    throw createError("Chỉ có thể đánh dấu vắng mặt sau giờ hẹn.", 409);
  }

  appointment.status = "no_show";
  appointment.receptionist = user._id;
  appointment.receptionistNote = data.note || "Lễ tân đánh dấu bệnh nhân vắng mặt.";
  if (appointment.appointmentSlot) {
    await appointmentRepository.updateAppointmentSlotStatus(appointment.appointmentSlot, "cancelled");
  }
  await appointmentRepository.saveAppointment(appointment);
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function createInvoiceForAppointment(appointmentId) {
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);
  return ensureAppointmentInvoice(appointment);
}

export async function processAppointmentPayment(appointmentId, body) {
  const data = appointmentPaymentSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  const invoice = await ensureAppointmentInvoice(appointment);
  invoice.status = "paid";
  invoice.paidAt = new Date();
  await appointmentRepository.saveInvoice(invoice);

  appointment.paymentStatus = appointment.service?.requiresPrepayment ? "paid" : "not_required";
  await appointmentRepository.saveAppointment(appointment);

  const payment = await appointmentRepository.createPayment({
    invoice: invoice._id,
    amount: invoice.total,
    paymentStatus: "paid",
    paymentMethod: data.paymentMethod
  });

  return { invoice, payment };
}

export async function getAppointmentInvoice(appointmentId, user) {
  const appointment = await requireAccessibleAppointment(appointmentId, user);
  return appointmentRepository.findInvoiceByAppointment(appointment._id);
}

export function getServicesForPayment() {
  return appointmentRepository.findActivePaymentServices();
}
