import { toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import {
  findById,
  findMany,
  insertDocuments,
  populate
} from "./mongoRepository.js";

const PUBLIC_DENTIST_LIMIT = 3;
const publicDentistProjection =
  "fullName email phone avatar avatarUrl yearsOfExperience bio licenseNo role status createdAt";

export function findActiveServices() {
  return findMany(COLLECTIONS.dentalServices, { isActive: true }, { sort: { name: 1 } });
}

function normalizeDentist(user, profile) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    avatarUrl: user.avatarUrl,
    yearsOfExperience: Number(user.yearsOfExperience || profile?.experienceYears || 0),
    licenseNo: user.licenseNo,
    qualification: profile?.qualification || "Bác sĩ Răng Hàm Mặt",
    bio: user.bio || profile?.description || "",
    description: profile?.description || user.bio || "",
    createdAt: user.createdAt
  };
}

async function attachDentistProfiles(users) {
  if (!users.length) return [];
  const profiles = await findMany(COLLECTIONS.dentists, {
    user: { $in: users.map((user) => user._id) },
    status: "active"
  });
  const profileMap = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
  return users.map((user) => normalizeDentist(user, profileMap.get(user._id.toString())));
}

export async function findActiveDentists() {
  const users = await findMany(
    COLLECTIONS.users,
    { role: "dentist", status: "active" },
    { projection: publicDentistProjection, sort: { fullName: 1 }, limit: PUBLIC_DENTIST_LIMIT }
  );
  return attachDentistProfiles(users);
}

export async function findActiveDentistById(id) {
  const user = await findById(COLLECTIONS.users, id, publicDentistProjection);
  if (!user || user.role !== "dentist" || user.status !== "active") return null;
  const [dentist] = await attachDentistProfiles([user]);
  return dentist;
}

export async function findActiveRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, { isActive: true }, { sort: { name: 1 } });
  await populate(rooms, {
    path: "assignedDentist",
    select: "fullName avatarUrl yearsOfExperience bio phone"
  });
  return rooms;
}

export async function findPublicReviews(limit = 8) {
  const reviews = await findMany(
    COLLECTIONS.reviews,
    { comment: { $exists: true, $ne: "" } },
    { sort: { createdAt: -1 }, limit }
  );
  await populate(reviews, [
    { path: "patient", select: "fullName" },
    { path: "service", select: "name" },
    { path: "dentist", select: "fullName" }
  ]);
  return reviews;
}

export async function findReviewsByDentist(dentistId, limit = 10) {
  const reviews = await findMany(
    COLLECTIONS.reviews,
    { dentist: toObjectId(dentistId) },
    { sort: { createdAt: -1 }, limit }
  );
  await populate(reviews, { path: "patient", select: "fullName" });
  return reviews;
}

export async function getPublicBootstrapData() {
  const [services, dentists, rooms, reviews] = await Promise.all([
    findActiveServices(),
    findActiveDentists(),
    findActiveRooms(),
    findPublicReviews(8)
  ]);
  return { services, dentists, rooms, reviews };
}

export function createConsultationRequest(data) {
  return insertDocuments(COLLECTIONS.consultationRequests, {
    status: "new",
    ...data
  });
}
