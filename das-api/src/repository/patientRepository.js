import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import TreatmentPlan from "../models/TreatmentPlan.js";
import TreatmentRecord from "../models/TreatmentRecord.js";

const appointmentPopulate = [
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "dentist", select: "fullName phone" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status equipment" },
  { path: "service", select: "name durationMinutes transitionTime price requiresPrepayment isConsultation" },
  { path: "appointmentSlot", select: "slotDate startAt endAt status" }
];

const treatmentRecordPopulate = [
  { path: "appointment", populate: [{ path: "service", select: "name" }, { path: "room", select: "name" }] },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const treatmentPlanPopulate = {
  path: "treatmentRecord",
  populate: [
    { path: "appointment", populate: [{ path: "service", select: "name" }] },
    { path: "dentist", select: "fullName" }
  ]
};

const invoiceAppointmentPopulate = {
  path: "appointment",
  populate: [{ path: "service", select: "name" }, { path: "dentist", select: "fullName" }]
};

export function findPatientAppointments(patientId) {
  return Appointment.find({ patient: patientId })
    .populate(appointmentPopulate)
    .sort({ startAt: 1 })
    .limit(120)
    .lean();
}

export function findPatientTreatmentRecords(patientId, lean = true) {
  const query = TreatmentRecord.find({ patient: patientId })
    .populate(treatmentRecordPopulate)
    .sort({ updatedAt: -1 })
    .limit(80);
  return lean ? query.lean() : query;
}

export function findPatientInvoices(patientId, lean = true) {
  const query = Invoice.find({ patient: patientId })
    .populate(invoiceAppointmentPopulate)
    .sort({ createdAt: -1 })
    .limit(80);
  return lean ? query.lean() : query;
}

export function findPatientReviews(patientId) {
  return Review.find({ patient: patientId })
    .populate([
      { path: "appointment", select: "startAt status" },
      { path: "dentist", select: "fullName" },
      { path: "service", select: "name" }
    ])
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(5)
    .lean();
}

export function findTreatmentPlansByRecords(recordIds, lean = true) {
  const query = TreatmentPlan.find({ treatmentRecord: { $in: recordIds } })
    .populate(treatmentPlanPopulate)
    .populate("dentist", "fullName")
    .sort({ updatedAt: -1 })
    .limit(80);
  return lean ? query.lean() : query;
}

export function findTreatmentRecordIdsByPatient(patientId) {
  return TreatmentRecord.find({ patient: patientId }).select("_id").lean();
}

export function findPatientInvoiceById(invoiceId, patientId) {
  return Invoice.findOne({ _id: invoiceId, patient: patientId }).populate({
    path: "appointment",
    populate: [{ path: "service", select: "name price" }, { path: "dentist", select: "fullName" }]
  });
}

export function findPatientInvoiceForPayment(invoiceId, patientId) {
  return Invoice.findOne({ _id: invoiceId, patient: patientId });
}

export function updateAppointmentPaymentStatus(appointmentId, patientId, paymentStatus) {
  return Appointment.findOneAndUpdate({ _id: appointmentId, patient: patientId }, { paymentStatus });
}

export function createPayment(data) {
  return Payment.create(data);
}

export function findCompletedPatientAppointment(appointmentId, patientId) {
  return Appointment.findOne({ _id: appointmentId, patient: patientId, status: "completed" });
}

export function upsertPatientReview(appointment, patientId, data) {
  return Review.findOneAndUpdate(
    { appointment: appointment._id },
    {
      patient: patientId,
      dentist: appointment.dentist,
      service: appointment.service,
      rating: data.rating,
      ratingDentist: data.rating,
      ratingService: data.rating,
      comment: data.comment
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export function findUpcomingPatientAppointments(patientId) {
  return Appointment.find({
    patient: patientId,
    status: { $in: ["pending", "scheduled", "confirmed", "waitlisted"] },
    startAt: { $gte: new Date() }
  })
    .populate("service", "name")
    .sort({ startAt: 1 })
    .limit(5)
    .lean();
}

export function findStoredNotifications(patientId) {
  return Notification.find({ user: patientId }).sort({ createdAt: -1 }).limit(10).lean();
}

export function markNotificationRead(notificationId, patientId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: patientId },
    { isRead: true },
    { new: true }
  );
}
