import ClinicRoom from "../models/ClinicRoom.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import DentalService from "../models/DentalService.js";
import Dentist from "../models/Dentist.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const PUBLIC_DENTIST_LIMIT = 3;
const publicDentistSelect = "fullName email phone avatar avatarUrl yearsOfExperience bio licenseNo createdAt";

export function findActiveServices() {
  return DentalService.find({ isActive: true }).sort({ name: 1 }).lean();
}

function normalizeDentist(user, profile) {
  const yearsOfExperience = Number(user.yearsOfExperience || profile?.experienceYears || 0);

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    avatarUrl: user.avatarUrl,
    yearsOfExperience,
    licenseNo: user.licenseNo,
    qualification: profile?.qualification || "Bác sĩ Răng Hàm Mặt",
    bio: user.bio || profile?.description || "",
    description: profile?.description || user.bio || "",
    createdAt: user.createdAt
  };
}

async function attachDentistProfiles(users) {
  if (!users.length) return [];

  const profiles = await Dentist.find({
    user: { $in: users.map((user) => user._id) },
    status: "active"
  })
    .select("user qualification experienceYears description")
    .lean();
  const profileMap = new Map(profiles.map((profile) => [profile.user.toString(), profile]));

  return users.map((user) => normalizeDentist(user, profileMap.get(user._id.toString())));
}

export async function findActiveDentists() {
  const users = await User.find({ role: "dentist", status: "active" })
    .select(publicDentistSelect)
    .sort({ fullName: 1 })
    .limit(PUBLIC_DENTIST_LIMIT)
    .lean();

  return attachDentistProfiles(users);
}

export async function findActiveDentistById(id) {
  const user = await User.findOne({ _id: id, role: "dentist", status: "active" }).select(publicDentistSelect).lean();
  if (!user) return null;
  const [dentist] = await attachDentistProfiles([user]);
  return dentist;
}

export function findActiveRooms() {
  return ClinicRoom.find({ isActive: true })
    .populate("assignedDentist", "fullName avatarUrl yearsOfExperience bio phone")
    .sort({ name: 1 })
    .lean();
}

export function findPublicReviews(limit = 8) {
  return Review.find({ comment: { $exists: true, $ne: "" } })
    .populate("patient", "fullName")
    .populate("service", "name")
    .populate("dentist", "fullName")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export function findReviewsByDentist(dentistId, limit = 10) {
  return Review.find({ dentist: dentistId })
    .populate("patient", "fullName")
    .sort({ createdAt: -1 })
    .limit(limit);
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
  return ConsultationRequest.create(data);
}
