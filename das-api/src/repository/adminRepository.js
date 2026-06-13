import AdminProfile from "../models/AdminProfile.js";
import Appointment from "../models/Appointment.js";
import ClinicRoom from "../models/ClinicRoom.js";
import ClinicWorkingHour from "../models/ClinicWorkingHour.js";
import DentalService from "../models/DentalService.js";
import Dentist from "../models/Dentist.js";
import Invoice from "../models/Invoice.js";
import Nurse from "../models/Nurse.js";
import Patient from "../models/Patient.js";
import Receptionist from "../models/Receptionist.js";
import Review from "../models/Review.js";
import Role from "../models/Role.js";
import StaffSchedule from "../models/StaffSchedule.js";
import TimeSlot from "../models/TimeSlot.js";
import User from "../models/User.js";

const roomDentistSelect = "fullName avatarUrl yearsOfExperience bio";
const staffSchedulePopulate = [
  { path: "user", select: "fullName role phone" },
  { path: "timeSlot", select: "slotName startTime endTime" },
  { path: "room", select: "name status" }
];

export function aggregateAppointmentStats() {
  return Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
}

export function aggregatePaidRevenue() {
  return Invoice.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]);
}

export function countPatients() {
  return Patient.countDocuments({});
}

export function countNewPatients(startDate, endDate) {
  const createdAt = { $gte: startDate };
  if (endDate) createdAt.$lte = endDate;
  return User.countDocuments({ role: "patient", createdAt });
}

export function aggregateReturningPatients(match = {}) {
  return Appointment.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$patient", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "total" }
  ]);
}

export function aggregateServiceUsage(match = {}, limit = null) {
  const pipeline = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$service", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  if (limit) pipeline.push({ $limit: limit });
  pipeline.push(
    { $lookup: { from: "dentalservices", localField: "_id", foreignField: "_id", as: "service" } },
    { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
    { $project: { count: 1, serviceName: "$service.name" } }
  );
  return Appointment.aggregate(pipeline);
}

export function countNoShowAppointments() {
  return Appointment.countDocuments({ status: "no_show" });
}

export function aggregateReviewStats() {
  return Review.aggregate([{ $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }]);
}

export function findDashboardUsers() {
  return User.find({}).select("-passwordHash").sort({ role: 1, fullName: 1 }).limit(160).lean();
}

export function findUsers(query = {}, limit = 200, lean = false) {
  const userQuery = User.find(query).select("-passwordHash").sort({ role: 1, fullName: 1 }).limit(limit);
  return lean ? userQuery.lean() : userQuery;
}

export function findDashboardServices() {
  return DentalService.find({}).sort({ isActive: -1, name: 1 }).lean();
}

export function findDashboardRooms() {
  return ClinicRoom.find().populate("assignedDentist", roomDentistSelect).sort({ name: 1 }).lean();
}

export function findWorkingHours(lean = false) {
  const query = ClinicWorkingHour.find().sort({ dayOfWeek: 1, startTime: 1 });
  return lean ? query.lean() : query;
}

export function findTimeSlots(lean = false) {
  const query = TimeSlot.find().sort({ startTime: 1 });
  return lean ? query.lean() : query;
}

export function findReviews() {
  return Review.find({})
    .populate("patient", "fullName phone")
    .populate("dentist", "fullName")
    .populate("service", "name")
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();
}

export function createWorkingHour(data) {
  return ClinicWorkingHour.create(data);
}

export function findWorkingHourById(workingHourId) {
  return ClinicWorkingHour.findById(workingHourId);
}

export function updateWorkingHour(workingHourId, data) {
  return ClinicWorkingHour.findByIdAndUpdate(workingHourId, data, { new: true });
}

export function findStaffSchedules(query, limit) {
  return StaffSchedule.find(query)
    .populate(staffSchedulePopulate)
    .sort({ workDate: 1, startTime: 1 })
    .limit(limit)
    .lean();
}

export function createStaffSchedule(data) {
  return StaffSchedule.create(data);
}

export function populateStaffSchedule(schedule) {
  return schedule.populate(staffSchedulePopulate);
}

export function findStaffScheduleById(scheduleId) {
  return StaffSchedule.findById(scheduleId);
}

export function updateStaffSchedule(scheduleId, update) {
  return StaffSchedule.findByIdAndUpdate(scheduleId, update, { new: true }).populate(staffSchedulePopulate);
}

export function countAppointments(match = {}) {
  return Appointment.countDocuments(match);
}

export function aggregateInvoicesByStatus(match = {}) {
  return Invoice.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } }
  ]);
}

export function aggregateAppointmentsByStatus(match = {}) {
  return Appointment.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
}

export function findRevenueInvoices(match, status, sort) {
  return Invoice.find({ ...match, status }).populate("appointment", "startAt").sort(sort).limit(80).lean();
}

export function ensureRole(data) {
  return Role.findOneAndUpdate({ roleName: data.roleName }, data, { new: true, upsert: true });
}

export function createUser(data) {
  return User.create(data);
}

export function findUserById(userId) {
  return User.findById(userId);
}

export function updateUser(userId, data) {
  return User.findByIdAndUpdate(userId, data, { new: true }).select("-passwordHash");
}

export function createPatientProfile(data) {
  return Patient.create(data);
}

export function createReceptionistProfile(data) {
  return Receptionist.create(data);
}

export function createDentistProfile(data) {
  return Dentist.create(data);
}

export function createNurseProfile(data) {
  return Nurse.create(data);
}

export function createAdminProfile(data) {
  return AdminProfile.create(data);
}

export function createDentalService(data) {
  return DentalService.create(data);
}

export function updateDentalService(serviceId, data) {
  return DentalService.findByIdAndUpdate(serviceId, data, { new: true });
}

export function findClinicRoomByName(name) {
  return ClinicRoom.findOne({ name });
}

export function createClinicRoom(data) {
  return ClinicRoom.create(data);
}

export function populateClinicRoom(room) {
  return room.populate("assignedDentist", roomDentistSelect);
}

export function updateClinicRoom(roomId, data) {
  return ClinicRoom.findByIdAndUpdate(roomId, data, { new: true }).populate("assignedDentist", roomDentistSelect);
}

export function findScheduleAssignmentUser(userId) {
  return User.findById(userId).select("fullName role status").lean();
}

export function findStaffScheduleConflict(query) {
  return StaffSchedule.findOne(query).populate("room", "name").lean();
}

export function findRoomForSchedule(roomId) {
  return ClinicRoom.findById(roomId).select("name status isActive").lean();
}

export function findRoomScheduleConflicts(query) {
  return StaffSchedule.find(query).populate("user", "fullName role").lean();
}
