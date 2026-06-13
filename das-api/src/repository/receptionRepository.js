import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import {
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  updateById,
  updateOneAndReturn
} from "./mongoRepository.js";

const appointmentPopulate = [
  { path: "patient", select: "fullName email phone" },
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "dentist", select: "fullName phone" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status equipment" },
  {
    path: "service",
    select: "name durationMinutes transitionTime price requiresPrepayment isConsultation"
  },
  { path: "appointmentSlot", select: "slotDate startAt endAt status" }
];

const consultationPopulate = [
  { path: "service", select: "name" },
  { path: "handledBy", select: "fullName" }
];

export function cancelAppointmentsAfterClose(query, update) {
  return getCollection(COLLECTIONS.appointments).updateMany(query, update);
}

export async function findReceptionAppointments(query) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    query,
    { sort: { startAt: 1 }, limit: 120 }
  );
  await populate(appointments, appointmentPopulate);
  return appointments;
}

export function findReceptionPatients(filter, limit = 50) {
  return findMany(COLLECTIONS.users, filter, {
    projection: "-passwordHash",
    sort: { fullName: 1 },
    limit
  });
}

export function findActiveServices() {
  return findMany(COLLECTIONS.dentalServices, { isActive: true }, { sort: { name: 1 } });
}

export async function findConsultationRequests(query = {}, limit = 100) {
  const requests = await findMany(
    COLLECTIONS.consultationRequests,
    normalizeIdFields(query, ["service", "handledBy"]),
    { sort: { createdAt: -1 }, limit }
  );
  await populate(requests, consultationPopulate);
  return requests;
}

export async function findReceptionRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {}, { sort: { name: 1 } });
  await populate(rooms, { path: "assignedDentist", select: "fullName" });
  return rooms;
}

export function findActivePatientById(patientId) {
  return findOne(COLLECTIONS.users, {
    _id: toObjectId(patientId),
    role: "patient",
    status: "active"
  });
}

export function findUserByPhone(phone) {
  return findOne(COLLECTIONS.users, { phone });
}

export function ensurePatientRole(data) {
  return updateOneAndReturn(
    COLLECTIONS.roles,
    { roleName: "patient" },
    data,
    { upsert: true }
  );
}

export function createPatientUser(data) {
  return insertDocuments(COLLECTIONS.users, {
    status: "active",
    ...data
  });
}

export function updatePatientUser(userId, data) {
  return updateById(COLLECTIONS.users, userId, data);
}

export function upsertPatientProfile(userId, data) {
  return updateOneAndReturn(
    COLLECTIONS.patients,
    { user: toObjectId(userId) },
    { ...data, user: toObjectId(userId) },
    { upsert: true }
  );
}

export function createPatientProfile(data) {
  return insertDocuments(COLLECTIONS.patients, {
    gender: "unknown",
    ...data
  });
}

export async function updateConsultationRequest(requestId, data) {
  const request = await updateById(COLLECTIONS.consultationRequests, requestId, data);
  await populate(request, consultationPopulate);
  return request;
}

export async function updateRoomStatus(roomId, status) {
  const room = await updateById(COLLECTIONS.clinicRooms, roomId, { status });
  await populate(room, { path: "assignedDentist", select: "fullName" });
  return room;
}

export function createRoomStatusLog(data) {
  return insertDocuments(COLLECTIONS.roomStatuses, data);
}
