import Appointment from "../models/Appointment.js";
import ClinicRoom from "../models/ClinicRoom.js";
import DentalService from "../models/DentalService.js";
import Notification from "../models/Notification.js";
import RoomStatus from "../models/RoomStatus.js";
import StaffSchedule from "../models/StaffSchedule.js";
import TreatmentPlan from "../models/TreatmentPlan.js";
import TreatmentRecord from "../models/TreatmentRecord.js";

const clinicalAppointmentPopulate = [
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" },
  { path: "room", select: "name status" },
  { path: "service", select: "name durationMinutes" }
];

const treatmentRecordPopulate = [
  { path: "appointment", populate: { path: "service", select: "name" } },
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const patientHistoryPopulate = [
  { path: "appointment", populate: [{ path: "service", select: "name" }, { path: "room", select: "name" }] },
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const treatmentPlanPopulate = {
  path: "treatmentRecord",
  populate: [
    { path: "appointment", populate: [{ path: "service", select: "name" }, { path: "patient", select: "fullName phone" }] },
    { path: "patient", select: "fullName phone" }
  ]
};

export function findClinicalAppointments(query, limit = 120, lean = false) {
  const appointmentQuery = Appointment.find(query).populate(clinicalAppointmentPopulate).sort({ startAt: 1 }).limit(limit);
  return lean ? appointmentQuery.lean() : appointmentQuery;
}

export function findClinicalTreatmentRecords(query, limit = 100, lean = false) {
  const recordQuery = TreatmentRecord.find(query).populate(treatmentRecordPopulate).sort({ updatedAt: -1 }).limit(limit);
  return lean ? recordQuery.lean() : recordQuery;
}

export function findClinicalRooms(lean = false) {
  const roomQuery = ClinicRoom.find().populate("assignedDentist", "fullName").sort({ name: 1 });
  return lean ? roomQuery.lean() : roomQuery;
}

export function findActiveDentalServices() {
  return DentalService.find({ isActive: true }).sort({ name: 1 }).lean();
}

export function findStaffSchedules(query, limit = 60, lean = false) {
  const scheduleQuery = StaffSchedule.find(query)
    .populate([
      { path: "timeSlot", select: "slotName startTime endTime" },
      { path: "room", select: "name status" }
    ])
    .sort({ workDate: 1, startTime: 1 })
    .limit(limit);
  return lean ? scheduleQuery.lean() : scheduleQuery;
}

export function hasRelatedAppointment(query) {
  return Appointment.exists(query);
}

export function findPatientAppointments(patientId) {
  return Appointment.find({ patient: patientId })
    .populate([
      { path: "patient", select: "fullName phone email gender address" },
      { path: "service", select: "name" },
      { path: "dentist", select: "fullName" },
      { path: "room", select: "name" }
    ])
    .sort({ startAt: -1 })
    .limit(10)
    .lean();
}

export function findPatientTreatmentHistory(patientId) {
  return TreatmentRecord.find({ patient: patientId })
    .populate(patientHistoryPopulate)
    .sort({ treatmentDate: -1, updatedAt: -1 })
    .limit(50);
}

export function findAppointmentById(appointmentId) {
  return Appointment.findById(appointmentId);
}

export function findAppointmentWithService(appointmentId) {
  return Appointment.findById(appointmentId).populate("service", "name");
}

export function findAssignedDentistRoom(dentistId) {
  return ClinicRoom.findOne({ assignedDentist: dentistId, isActive: true }).select("_id").lean();
}

export function upsertTreatmentRecord(appointmentId, update) {
  return TreatmentRecord.findOneAndUpdate(
    { appointment: appointmentId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate([
    { path: "appointment", populate: { path: "service", select: "name" } },
    { path: "patient", select: "fullName phone email" }
  ]);
}

export function upsertTreatmentPlan(treatmentRecordId, update, populateDentist = false) {
  const planQuery = TreatmentPlan.findOneAndUpdate(
    { treatmentRecord: treatmentRecordId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return populateDentist ? planQuery.populate("dentist", "fullName") : planQuery;
}

export function findTreatmentPlans(query) {
  return TreatmentPlan.find(query)
    .populate(treatmentPlanPopulate)
    .populate("dentist", "fullName")
    .sort({ updatedAt: -1 })
    .limit(100);
}

export function findTreatmentPlanById(planId) {
  return TreatmentPlan.findById(planId);
}

export function updateTreatmentRecordPlan(recordId, planDetail) {
  return TreatmentRecord.findByIdAndUpdate(recordId, { treatmentPlan: planDetail });
}

export function updateRoomStatus(roomId, data) {
  return ClinicRoom.findByIdAndUpdate(roomId, data, { new: true });
}

export function createRoomStatus(data) {
  return RoomStatus.create(data);
}

export function createNotification(data) {
  return Notification.create(data);
}
