export const systemHighlights = [
  { label: "Quy mô nhóm", value: "4 thành viên, 4 tuần, hệ thống quản lý phòng khám nha khoa" },
  { label: "Tác nhân", value: "Khách, người dùng, bệnh nhân, nhân sự lâm sàng, bác sĩ, y tá, lễ tân, quản trị viên" },
  { label: "Luồng chính", value: "Tư vấn, tài khoản, lịch hẹn, điều trị, hóa đơn, thanh toán, đánh giá" },
  { label: "Luồng quản trị", value: "Tài khoản, dịch vụ, phòng khám, giờ làm, lịch nhân sự, báo cáo" }
];

export const workflowUseCases = [
  {
    workflow: "WF1",
    name: "Khách và xác thực",
    useCases: [
      { id: "UC-01", actor: "Khách", name: "Gửi yêu cầu tư vấn đặt lịch", feature: "Yêu cầu tư vấn" },
      { id: "UC-02", actor: "Khách", name: "Xem dịch vụ nha khoa", feature: "Thông tin công khai" },
      { id: "UC-03", actor: "Khách", name: "Xem thông tin phòng khám", feature: "Thông tin công khai" },
      { id: "UC-04", actor: "Khách", name: "Xem hồ sơ bác sĩ", feature: "Thông tin công khai" },
      { id: "UC-05", actor: "Khách", name: "Xem đánh giá và xếp hạng", feature: "Phản hồi công khai" },
      { id: "UC-06", actor: "Khách", name: "Tạo tài khoản", feature: "Xác thực người dùng" },
      { id: "UC-07", actor: "Khách", name: "Đăng nhập", feature: "Xác thực người dùng" },
      { id: "UC-08", actor: "Khách", name: "Đặt lại mật khẩu đã quên", feature: "Xác thực người dùng" },
      { id: "UC-09", actor: "Người dùng", name: "Đăng xuất", feature: "Xác thực người dùng" },
      { id: "UC-10", actor: "Người dùng", name: "Đổi mật khẩu", feature: "Quản lý hồ sơ" },
      { id: "UC-11", actor: "Người dùng", name: "Xem hồ sơ cá nhân", feature: "Quản lý hồ sơ" },
      { id: "UC-12", actor: "Người dùng", name: "Cập nhật hồ sơ cá nhân", feature: "Quản lý hồ sơ" },
      { id: "UC-13", actor: "Người dùng", name: "Xem thông báo", feature: "Quản lý thông báo" }
    ]
  },
  {
    workflow: "WF2",
    name: "Bệnh nhân tự phục vụ",
    useCases: [
      { id: "UC-14", actor: "Bệnh nhân", name: "Đặt lịch khám", feature: "Đặt lịch" },
      { id: "UC-15", actor: "Bệnh nhân", name: "Xem lịch hẹn", feature: "Quản lý lịch hẹn" },
      { id: "UC-16", actor: "Bệnh nhân", name: "Dời lịch hẹn", feature: "Quản lý lịch hẹn" },
      { id: "UC-17", actor: "Bệnh nhân", name: "Hủy lịch hẹn", feature: "Quản lý lịch hẹn" },
      { id: "UC-18", actor: "Bệnh nhân", name: "Xem kế hoạch điều trị", feature: "Quản lý điều trị" },
      { id: "UC-19", actor: "Bệnh nhân", name: "Xem hồ sơ điều trị", feature: "Quản lý điều trị" },
      { id: "UC-20", actor: "Bệnh nhân", name: "Xem hóa đơn", feature: "Quản lý hóa đơn" },
      { id: "UC-21", actor: "Bệnh nhân", name: "Gửi đánh giá và xếp hạng", feature: "Quản lý phản hồi" }
    ]
  },
  {
    workflow: "WF3",
    name: "Vận hành lâm sàng",
    useCases: [
      { id: "UC-22", actor: "Nhân sự lâm sàng", name: "Xem lịch làm việc", feature: "Quản lý lịch nhân sự" },
      { id: "UC-23", actor: "Nhân sự lâm sàng", name: "Xem thông tin bệnh nhân", feature: "Quản lý thông tin bệnh nhân" },
      { id: "UC-24", actor: "Nhân sự lâm sàng", name: "Xem lịch sử điều trị", feature: "Quản lý hồ sơ bệnh án" },
      { id: "UC-25", actor: "Bác sĩ", name: "Quản lý kế hoạch điều trị", feature: "Quản lý kế hoạch điều trị" },
      { id: "UC-26", actor: "Bác sĩ", name: "Đặt lịch tái khám", feature: "Quản lý tái khám" },
      { id: "UC-27", actor: "Y tá", name: "Ghi nhận chỉ số sinh tồn", feature: "Khám bệnh" },
      { id: "UC-28", actor: "Y tá", name: "Cập nhật trạng thái phòng khám", feature: "Quản lý phòng lâm sàng" },
      { id: "UC-29", actor: "Y tá", name: "Ghi chú hỗ trợ chẩn đoán", feature: "Ghi nhận điều trị" }
    ]
  },
  {
    workflow: "WF4",
    name: "Vận hành lễ tân",
    useCases: [
      { id: "UC-30", actor: "Lễ tân", name: "Quản lý lịch hẹn", feature: "Quản lý lịch hẹn" },
      { id: "UC-31", actor: "Lễ tân", name: "Check-in bệnh nhân", feature: "Tiếp nhận bệnh nhân" },
      { id: "UC-32", actor: "Lễ tân", name: "Xử lý bệnh nhân vắng mặt", feature: "Tiếp nhận bệnh nhân" },
      { id: "UC-33", actor: "Lễ tân", name: "Tạo hóa đơn", feature: "Quản lý hóa đơn" },
      { id: "UC-34", actor: "Lễ tân", name: "Xử lý thanh toán", feature: "Quản lý thanh toán" },
      { id: "UC-35", actor: "Lễ tân", name: "Quản lý yêu cầu tư vấn", feature: "Quản lý tư vấn" },
      { id: "UC-36", actor: "Lễ tân", name: "Đặt lịch cho bệnh nhân", feature: "Đặt lịch" },
      { id: "UC-37", actor: "Lễ tân", name: "Tìm kiếm tài khoản bệnh nhân", feature: "Quản lý tài khoản bệnh nhân" },
      { id: "UC-38", actor: "Lễ tân", name: "Tạo tài khoản bệnh nhân", feature: "Quản lý tài khoản bệnh nhân" },
      { id: "UC-39", actor: "Lễ tân", name: "Quản lý phòng khám", feature: "Quản lý phòng lâm sàng" }
    ]
  },
  {
    workflow: "WF5",
    name: "Quản trị và báo cáo",
    useCases: [
      { id: "UC-40", actor: "Quản trị viên", name: "Quản lý dịch vụ nha khoa", feature: "Quản lý dịch vụ" },
      { id: "UC-41", actor: "Quản trị viên", name: "Quản lý tài khoản", feature: "Quản lý tài khoản" },
      { id: "UC-42", actor: "Quản trị viên", name: "Quản lý phòng khám", feature: "Quản lý phòng khám" },
      { id: "UC-43", actor: "Quản trị viên", name: "Quản lý giờ làm phòng khám", feature: "Quản lý giờ làm" },
      { id: "UC-44", actor: "Quản trị viên", name: "Quản lý lịch nhân sự", feature: "Quản lý lịch nhân sự" },
      { id: "UC-45", actor: "Quản trị viên", name: "Xem báo cáo doanh thu", feature: "Quản lý báo cáo" },
      { id: "UC-46", actor: "Quản trị viên", name: "Xem thống kê bệnh nhân", feature: "Quản lý thống kê" },
      { id: "UC-47", actor: "Quản trị viên", name: "Xem đánh giá và xếp hạng", feature: "Quản lý phản hồi" }
    ]
  }
];

export const actorUseCaseCoverage = [
  { actor: "Khách", summary: "Trang công khai và luồng vào tài khoản.", entry: "/", useCases: ["UC-01", "UC-02", "UC-03", "UC-04", "UC-05", "UC-06", "UC-07", "UC-08"] },
  { actor: "Người dùng", summary: "Hồ sơ, mật khẩu và thông báo dùng chung.", entry: "/profile", useCases: ["UC-09", "UC-10", "UC-11", "UC-12", "UC-13"] },
  { actor: "Bệnh nhân", summary: "Đặt lịch, xem điều trị, hóa đơn và gửi đánh giá.", entry: "/dashboard", useCases: ["UC-14", "UC-15", "UC-16", "UC-17", "UC-18", "UC-19", "UC-20", "UC-21"] },
  { actor: "Nhân sự lâm sàng", summary: "Lịch được phân công, thông tin bệnh nhân và lịch sử điều trị.", entry: "/dashboard", useCases: ["UC-22", "UC-23", "UC-24"] },
  { actor: "Bác sĩ", summary: "Kế hoạch điều trị và lịch tái khám.", entry: "/dashboard", useCases: ["UC-25", "UC-26"] },
  { actor: "Y tá", summary: "Chỉ số sinh tồn, ghi chú hỗ trợ chẩn đoán và trạng thái phòng.", entry: "/dashboard", useCases: ["UC-27", "UC-28", "UC-29"] },
  { actor: "Lễ tân", summary: "Lịch hẹn, check-in, hóa đơn, thanh toán, tư vấn và tài khoản bệnh nhân.", entry: "/dashboard", useCases: ["UC-30", "UC-31", "UC-32", "UC-33", "UC-34", "UC-35", "UC-36", "UC-37", "UC-38", "UC-39"] },
  { actor: "Quản trị viên", summary: "Dữ liệu nền, tài khoản, lịch, báo cáo, thống kê và đánh giá.", entry: "/dashboard", useCases: ["UC-40", "UC-41", "UC-42", "UC-43", "UC-44", "UC-45", "UC-46", "UC-47"] }
];

export const erdCoverage = [
  "ROLE / USER",
  "PATIENT / RECEPTIONIST / DENTIST / NURSE / ADMIN",
  "CLINIC_WORKING_HOUR / TIME_SLOT / STAFF_SCHEDULE",
  "DENTAL_SERVICE / DENTIST_SERVICE",
  "CLINIC_ROOM / ROOM_STATUS",
  "APPOINTMENT_SLOT / APPOINTMENT",
  "CONSULTATION_REQUEST",
  "TREATMENT_RECORD / TREATMENT_PLAN / PRESCRIPTION",
  "INVOICE / PAYMENT",
  "REVIEW / NOTIFICATION"
];
