import Appointment from "../models/Appointment.js";
import ClinicRoom from "../models/ClinicRoom.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import DentalService from "../models/DentalService.js";
import Patient from "../models/Patient.js";
import Role from "../models/Role.js";
import RoomStatus from "../models/RoomStatus.js";
import User from "../models/User.js";

const appointmentPopulate = [
  { path: "patient", select: "fullName email phone" },
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "dentist", select: "fullName phone" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status equipment" },
  { path: "service", select: "name durationMinutes transitionTime price requiresPrepayment isConsultation" },
  { path: "appointmentSlot", select: "slotDate startAt endAt status" }
];

const consultationPopulate = [
  { path: "service", select: "name" },
  { path: "handledBy", select: "fullName" }
];

export function cancelAppointmentsAfterClose(query, update) {
  return Appointment.updateMany(query, update);
}

export function findReceptionAppointments(query) {
  return Appointment.find(query).populate(appointmentPopulate).sort({ startAt: 1 }).limit(120).lean();
}

export function findReceptionPatients(filter, limit = 50, lean = false) {
  const query = User.find(filter).select("-passwordHash").sort({ fullName: 1 }).limit(limit);
  return lean ? query.lean() : query;
}

export function findActiveServices() {
  return DentalService.find({ isActive: true }).sort({ name: 1 }).lean();
}

export function findConsultationRequests(query = {}, limit = 100, lean = false) {
  const requestQuery = ConsultationRequest.find(query).populate(consultationPopulate).sort({ createdAt: -1 }).limit(limit);
  return lean ? requestQuery.lean() : requestQuery;
}

export function findReceptionRooms(lean = false) {
  const query = ClinicRoom.find().populate("assignedDentist", "fullName").sort({ name: 1 });
  return lean ? query.lean() : query;
}

export function findActivePatientById(patientId) {
  return User.findOne({ _id: patientId, role: "patient", status: "active" });
}

export function findUserByPhone(phone) {
  return User.findOne({ phone });
}

export function ensurePatientRole(data) {
  return Role.findOneAndUpdate({ roleName: "patient" }, data, { new: true, upsert: true });
}

export function createPatientUser(data) {
  return User.create(data);
}

export function upsertPatientProfile(userId, data) {
  return Patient.findOneAndUpdate({ user: userId }, data, { upsert: true });
}

export function createPatientProfile(data) {
  return Patient.create(data);
}

export function updateConsultationRequest(requestId, data) {
  return ConsultationRequest.findByIdAndUpdate(requestId, data, { new: true }).populate(consultationPopulate);
}

export function updateRoomStatus(roomId, status) {
  return ClinicRoom.findByIdAndUpdate(roomId, { status }, { new: true }).populate("assignedDentist", "fullName");
}

export function createRoomStatusLog(data) {
  return RoomStatus.create(data);
}
