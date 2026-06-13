import Appointment from "../models/Appointment.js";
import AppointmentSlot from "../models/AppointmentSlot.js";
import ClinicRoom from "../models/ClinicRoom.js";
import DentalService from "../models/DentalService.js";
import DentistService from "../models/DentistService.js";
import User from "../models/User.js";

export function findAppointments(query, select) {
  const appointmentQuery = Appointment.find(query);
  if (select) appointmentQuery.select(select);
  return appointmentQuery.sort({ startAt: 1 }).lean();
}

export function findAppointmentConflict(query, select) {
  const appointmentQuery = Appointment.findOne(query);
  if (select) appointmentQuery.select(select);
  return appointmentQuery.lean();
}

export function findServiceById(serviceId) {
  return DentalService.findById(serviceId).lean();
}

export function findDentistServicesByService(serviceId) {
  return DentistService.find({ service: serviceId }).lean();
}

export function findActiveRoomsWithDentists() {
  return ClinicRoom.find({
    isActive: true,
    status: { $ne: "maintenance" }
  })
    .populate("assignedDentist", "fullName yearsOfExperience bio email phone avatarUrl")
    .lean();
}

export function findActiveNurses() {
  return User.find({ role: "nurse", status: "active" }).sort({ fullName: 1 }).lean();
}

export function findPatientById(patientId) {
  return User.findById(patientId).lean();
}

export function createAppointmentSlot(data) {
  return AppointmentSlot.create(data);
}

export function updateAppointmentSlotStatus(slotId, status) {
  return AppointmentSlot.findByIdAndUpdate(slotId, { status });
}

export function createAppointment(data) {
  return Appointment.create(data);
}
