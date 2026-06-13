import Appointment from "../models/Appointment.js";
import AppointmentSlot from "../models/AppointmentSlot.js";
import DentalService from "../models/DentalService.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";

export const appointmentPopulate = [
  { path: "patient", select: "fullName email phone" },
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "confirmationBy", select: "fullName role" },
  { path: "dentist", select: "fullName phone avatarUrl yearsOfExperience bio" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status equipment" },
  { path: "service", select: "name durationMinutes transitionTime price requiresPrepayment isConsultation" },
  { path: "appointmentSlot", select: "slotDate startAt endAt status" }
];

export function findAppointments(query) {
  return Appointment.find(query).populate(appointmentPopulate).sort({ startAt: 1 }).limit(200);
}

export function findAppointmentById(appointmentId) {
  return Appointment.findById(appointmentId);
}

export function findAppointmentByIdPopulated(appointmentId) {
  return Appointment.findById(appointmentId).populate(appointmentPopulate);
}

export function findAppointmentWithService(appointmentId) {
  return Appointment.findById(appointmentId).populate("service");
}

export function findAppointmentWithServiceName(appointmentId) {
  return Appointment.findById(appointmentId).populate("service", "name");
}

export function populateAppointment(appointment) {
  return appointment.populate(appointmentPopulate);
}

export function updateAppointmentSlotStatus(slotId, status) {
  return AppointmentSlot.findByIdAndUpdate(slotId, { status });
}

export function createPatientNotification(data) {
  return Notification.create(data);
}

export function findInvoiceByAppointment(appointmentId) {
  return Invoice.findOne({ appointment: appointmentId });
}

export function createInvoice(data) {
  return Invoice.create(data);
}

export function createPayment(data) {
  return Payment.create(data);
}

export function findActivePaymentServices() {
  return DentalService.find({ isActive: true });
}
