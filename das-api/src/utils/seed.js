import {
  closeMongoDB,
  connectMongoDB,
  getCollection
} from "../config/mongodb.js";
import { getInheritanceChain, ROLE_HIERARCHY } from "../config/roleHierarchy.js";
import { COLLECTIONS } from "../models/collections.js";
import { insertDocuments } from "../repository/mongoRepository.js";
import { createAppointmentFromSlot } from "../services/schedulingService.js";
import { hashPassword } from "./password.js";
import { isWorkingDate, toDateInputValue } from "./time.js";

function nextWorkingDates(count, offsetDays = 1) {
  const dates = [];
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  while (dates.length < count) {
    const dateText = toDateInputValue(date);
    if (isWorkingDate(dateText)) dates.push(dateText);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

async function clearDatabase() {
  await Promise.all(
    Object.values(COLLECTIONS).map((collectionName) =>
      getCollection(collectionName).deleteMany({})
    )
  );
}

async function createRoles() {
  const roleDocuments = Object.entries(ROLE_HIERARCHY).map(([roleName, config]) => ({
    roleName,
    parentRoleName: config.parent,
    isAbstract: config.abstract,
    inheritanceChain: getInheritanceChain(roleName),
    description: config.description
  }));
  const createdRoles = await insertDocuments(COLLECTIONS.roles, roleDocuments);
  return Object.fromEntries(createdRoles.map((role) => [role.roleName, role]));
}

async function createWorkingCalendar() {
  const workingHours = [];
  for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
    workingHours.push(
      {
        dayOfWeek,
        shiftName: "Ca sáng",
        startTime: "08:00",
        endTime: "11:30",
        status: "active"
      },
      {
        dayOfWeek,
        shiftName: "Ca chiều",
        startTime: "14:00",
        endTime: "17:30",
        status: "active"
      }
    );
  }
  await insertDocuments(COLLECTIONS.clinicWorkingHours, workingHours);
  return insertDocuments(COLLECTIONS.timeSlots, [
    { slotName: "Ca sáng", startTime: "08:00", endTime: "11:30" },
    { slotName: "Ca chiều", startTime: "14:00", endTime: "17:30" }
  ]);
}

const dentistProfiles = [
  {
    fullName: "BS. Nguyễn Minh Anh",
    email: "dentist1@das.local",
    phone: "0902000001",
    yearsOfExperience: 9,
    bio: "Có kinh nghiệm thăm khám, tư vấn kế hoạch điều trị và theo dõi tiến trình chăm sóc răng miệng cho bệnh nhân.",
    licenseNo: "DAS-DEN-001",
    avatarUrl: "/assets/doctors/doctor-minh-anh.png"
  },
  {
    fullName: "BS. Trần Hoàng Nam",
    email: "dentist2@das.local",
    phone: "0902000002",
    yearsOfExperience: 12,
    bio: "Phụ trách thăm khám, tư vấn phương án điều trị phù hợp và phối hợp cùng đội ngũ lâm sàng trong từng ca khám.",
    licenseNo: "DAS-DEN-002",
    avatarUrl: "/assets/doctors/doctor-hoang-nam.png"
  },
  {
    fullName: "BS. Lê Thanh Vy",
    email: "dentist3@das.local",
    phone: "0902000003",
    yearsOfExperience: 7,
    bio: "Tập trung vào trải nghiệm thăm khám nhẹ nhàng, giải thích rõ kế hoạch điều trị và hướng dẫn chăm sóc sau khám.",
    licenseNo: "DAS-DEN-003",
    avatarUrl: "/assets/doctors/doctor-thanh-vy.png"
  }
];

async function seedUsers(roles, passwordHash) {
  const admin = await insertDocuments(COLLECTIONS.users, {
    fullName: "Quản trị DAS",
    email: "admin@das.local",
    phone: "0900000000",
    role: "admin",
    roleRef: roles.admin._id,
    status: "active",
    gender: "unknown",
    passwordHash
  });
  await insertDocuments(COLLECTIONS.adminProfiles, {
    user: admin._id,
    position: "Quản trị hệ thống phòng khám",
    permissionLevel: "super_admin",
    status: "active"
  });

  const receptionists = await insertDocuments(
    COLLECTIONS.users,
    Array.from({ length: 4 }, (_, index) => ({
      fullName: `Lễ tân ${index + 1}`,
      email: `receptionist${index + 1}@das.local`,
      phone: `090100000${index + 1}`,
      role: "receptionist",
      roleRef: roles.receptionist._id,
      status: "active",
      gender: "unknown",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.receptionists,
    receptionists.map((user) => ({ user: user._id, status: "active" }))
  );

  const dentists = await insertDocuments(
    COLLECTIONS.users,
    dentistProfiles.map((dentist) => ({
      ...dentist,
      role: "dentist",
      roleRef: roles.dentist._id,
      status: "active",
      gender: "unknown",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.dentists,
    dentists.map((user, index) => ({
      user: user._id,
      qualification: "Bác sĩ Răng Hàm Mặt",
      experienceYears: dentistProfiles[index].yearsOfExperience,
      description: dentistProfiles[index].bio,
      status: "active"
    }))
  );

  const nurses = await insertDocuments(
    COLLECTIONS.users,
    Array.from({ length: 8 }, (_, index) => ({
      fullName: `Y tá ${index + 1}`,
      email: `nurse${index + 1}@das.local`,
      phone: `090300000${index + 1}`,
      role: "nurse",
      roleRef: roles.nurse._id,
      status: "active",
      gender: "unknown",
      yearsOfExperience: 2 + index,
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.nurses,
    nurses.map((user) => ({
      user: user._id,
      qualification: "Y tá đã đăng ký",
      status: "active"
    }))
  );

  const patients = await insertDocuments(COLLECTIONS.users, [
    {
      fullName: "Bệnh nhân 1",
      email: "patient1@das.local",
      phone: "0911000001",
      role: "patient",
      roleRef: roles.patient._id,
      status: "active",
      gender: "unknown",
      address: "Quận 1",
      passwordHash
    },
    {
      fullName: "Bệnh nhân 2",
      email: "patient2@das.local",
      phone: "0911000002",
      role: "patient",
      roleRef: roles.patient._id,
      status: "active",
      gender: "unknown",
      address: "Quận 3",
      passwordHash
    }
  ]);
  await insertDocuments(COLLECTIONS.patients, [
    {
      user: patients[0]._id,
      gender: "unknown",
      address: "Quận 1",
      medicalNote: "Chưa ghi nhận dị ứng."
    },
    {
      user: patients[1]._id,
      gender: "unknown",
      address: "Quận 3",
      medicalNote: "Ưu tiên lịch buổi chiều."
    }
  ]);

  return { admin, receptionists, dentists, nurses, patients };
}

async function seedClinic(dentists, nurses, timeSlots) {
  const services = await insertDocuments(COLLECTIONS.dentalServices, [
    {
      name: "Trám răng",
      description: "Điều trị sâu răng giá cố định, thanh toán khi bệnh nhân đến khám.",
      durationMinutes: 30,
      transitionTime: 10,
      price: 300000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    },
    {
      name: "Nhổ răng khôn",
      description: "Dịch vụ phẫu thuật răng miệng, thời lượng dự kiến 60 phút.",
      durationMinutes: 60,
      transitionTime: 10,
      price: 1500000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    },
    {
      name: "Tư vấn nha khoa",
      description: "Tư vấn cho bệnh nhân chưa xác định rõ tình trạng răng miệng.",
      durationMinutes: 30,
      transitionTime: 10,
      price: 0,
      requiresPrepayment: false,
      isConsultation: true,
      isActive: true
    },
    {
      name: "Cạo vôi răng",
      description: "Dịch vụ vệ sinh răng miệng giá cố định.",
      durationMinutes: 30,
      transitionTime: 10,
      price: 250000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    },
    {
      name: "Tẩy trắng răng",
      description: "Dịch vụ thẩm mỹ nha khoa giá cố định.",
      durationMinutes: 45,
      transitionTime: 10,
      price: 1200000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    }
  ]);

  await insertDocuments(
    COLLECTIONS.dentistServices,
    dentists.flatMap((dentist) =>
      services.map((service) => ({ dentist: dentist._id, service: service._id }))
    )
  );

  const rooms = await insertDocuments(
    COLLECTIONS.clinicRooms,
    dentists.map((dentist, index) => ({
      name: `Phòng khám ${index + 1}`,
      roomType: "Phòng điều trị nha khoa",
      description: "Phòng được trang bị cho quy trình vận hành DAS.",
      assignedDentist: dentist._id,
      equipment: [
        "Máy chụp X-quang",
        "Máy đo huyết áp",
        "Máy đo SpO2",
        "Nhiệt kế",
        "Máy theo dõi hô hấp"
      ],
      status: "available",
      isActive: true
    }))
  );

  await insertDocuments(
    COLLECTIONS.roomStatuses,
    rooms.map((room, index) => ({
      room: room._id,
      nurse: nurses[index % nurses.length]._id,
      availabilityStatus: "available",
      note: "Trạng thái phòng ban đầu từ dữ liệu mẫu."
    }))
  );

  const workingDates = nextWorkingDates(12);
  await insertDocuments(
    COLLECTIONS.staffSchedules,
    workingDates.flatMap((dateText) => {
      const workDate = new Date(`${dateText}T00:00:00`);
      const dentistSchedules = rooms.flatMap((room, roomIndex) =>
        timeSlots.map((slot) => ({
          user: dentists[roomIndex]._id,
          room: room._id,
          timeSlot: slot._id,
          workDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "scheduled"
        }))
      );
      const nurseSchedules = nurses.flatMap((nurse) =>
        timeSlots.map((slot) => ({
          user: nurse._id,
          timeSlot: slot._id,
          workDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "scheduled"
        }))
      );
      return [...dentistSchedules, ...nurseSchedules];
    })
  );

  return { services, rooms, workingDates };
}

async function seedOperationalData(users, clinic) {
  const { receptionists, patients } = users;
  const { services, workingDates } = clinic;
  const date = workingDates[0];

  const firstAppointment = await createAppointmentFromSlot({
    requester: receptionists[0],
    patientId: patients[0]._id,
    serviceId: services[0]._id,
    date,
    channel: "offline",
    note: "Lịch mẫu cho bảng lễ tân."
  });
  const consultationAppointment = await createAppointmentFromSlot({
    requester: patients[1],
    patientId: patients[1]._id,
    serviceId: services[2]._id,
    date,
    channel: "online",
    note: "Lịch tư vấn trực tuyến mẫu."
  });

  const invoice = await insertDocuments(COLLECTIONS.invoices, {
    appointment: firstAppointment._id,
    patient: patients[0]._id,
    items: [{ name: services[0].name, amount: services[0].price }],
    total: services[0].price,
    totalAmount: services[0].price,
    invoiceDate: new Date(),
    status: "unpaid"
  });
  await insertDocuments(COLLECTIONS.payments, {
    invoice: invoice._id,
    paymentMethod: "cash",
    amount: 0,
    paymentStatus: "pending",
    paymentDate: new Date()
  });

  const treatmentRecord = await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: consultationAppointment._id,
    patient: patients[1]._id,
    dentist: consultationAppointment.dentist,
    nurse: consultationAppointment.nurse,
    diagnosis: "Hồ sơ tư vấn ban đầu.",
    treatmentResult: "Đang chờ kế hoạch điều trị.",
    treatmentDate: new Date(),
    status: "draft"
  });
  await insertDocuments(COLLECTIONS.treatmentPlans, {
    treatmentRecord: treatmentRecord._id,
    dentist: consultationAppointment.dentist,
    planDetail: "Tái khám và lập dự toán điều trị chi tiết.",
    estimatedCost: 0,
    startDate: new Date(),
    status: "draft"
  });
  await insertDocuments(COLLECTIONS.prescriptions, {
    treatmentRecord: treatmentRecord._id,
    dentist: consultationAppointment.dentist,
    medicineName: "Thuốc giảm đau khi cần",
    dosage: "Theo hướng dẫn",
    instruction: "Chỉ dùng khi đau trước buổi tái khám.",
    note: "Đơn thuốc mẫu."
  });
  await insertDocuments(COLLECTIONS.consultationRequests, {
    fullName: "Khách tư vấn",
    phone: "0988000001",
    email: "guest@example.com",
    service: services[2]._id,
    preferredDate: new Date(`${date}T00:00:00`),
    preferredTime: "14:00",
    message: "Muốn tư vấn đau răng trước khi đặt lịch.",
    status: "new"
  });
  await insertDocuments(COLLECTIONS.notifications, [
    {
      user: patients[0]._id,
      title: "Đã tạo lịch hẹn",
      message: "Lịch hẹn của bạn đã được tạo từ dữ liệu mẫu.",
      isRead: false
    },
    {
      user: patients[1]._id,
      title: "Đã đặt lịch tư vấn",
      message: "Lịch tư vấn trực tuyến của bạn đã được tạo.",
      isRead: false
    }
  ]);
}

async function run() {
  await connectMongoDB();
  await clearDatabase();
  const passwordHash = await hashPassword("Password123!");
  const roles = await createRoles();
  const timeSlots = await createWorkingCalendar();
  const users = await seedUsers(roles, passwordHash);
  const clinic = await seedClinic(users.dentists, users.nurses, timeSlots);
  await seedOperationalData(users, clinic);
  await closeMongoDB();
}

run().catch(async (error) => {
  await closeMongoDB();
  throw error;
});
