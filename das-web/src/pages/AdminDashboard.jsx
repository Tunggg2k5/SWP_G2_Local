import { BarChart3, CalendarDays, DoorOpen, Download, Settings2, Star, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AccountManagement from "../components/admin/AccountManagement.jsx";
import AdminOverview from "../components/admin/AdminOverview.jsx";
import AdminReportPanel from "../components/admin/AdminReportPanel.jsx";
import AdminReviewList from "../components/admin/AdminReviewList.jsx";
import ClinicWorkingHours from "../components/admin/ClinicWorkingHours.jsx";
import ClinicRoomManagement from "../components/admin/ClinicRoomManagement.jsx";
import DentalServiceManagement from "../components/admin/DentalServiceManagement.jsx";
import StaffScheduleManagement from "../components/admin/StaffScheduleManagement.jsx";
import Feedback from "../components/Feedback.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { todayInput } from "../utils/format.js";
import { firstError, requireValue, validateDate, validateEmail, validateName, validateNote, validatePhone } from "../utils/validation.js";

const adminFeatures = [
  { id: "overview", label: "Thống kê", icon: BarChart3 },
  { id: "users", label: "Tài khoản", icon: UsersRound },
  { id: "services", label: "Dịch vụ", icon: Settings2 },
  { id: "rooms", label: "Phòng khám", icon: DoorOpen },
  { id: "workingHours", label: "Giờ làm", icon: CalendarDays },
  { id: "schedules", label: "Lịch nhân sự", icon: CalendarDays },
  { id: "reports", label: "Báo cáo", icon: Download },
  { id: "reviews", label: "Đánh giá", icon: Star }
];

const staffRoles = ["dentist", "nurse", "receptionist"];
const dayNames = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7"
};
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const clinicSessions = [
  { start: "08:00", end: "11:30" },
  { start: "14:00", end: "17:30" }
];

export default function AdminDashboard() {
  const location = useLocation();
  const [activeFeature, setActiveFeature] = useState("overview");
  const [stats, setStats] = useState(null);
  const [roleHierarchy, setRoleHierarchy] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [patientStatistics, setPatientStatistics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    startDate: todayInput().slice(0, 8) + "01",
    endDate: todayInput()
  });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: 0,
    requiresPrepayment: true,
    isConsultation: false
  });
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "patient"
  });
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    assignedDentist: "",
    status: "available"
  });
  const [workingHourForm, setWorkingHourForm] = useState({
    dayOfWeek: 1,
    shiftName: "Ca sáng",
    startTime: "08:00",
    endTime: "11:30"
  });
  const [scheduleForm, setScheduleForm] = useState({
    userId: "",
    timeSlotId: "",
    roomId: "",
    workDate: todayInput(),
    startTime: "08:00",
    endTime: "11:30"
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data.stats);
      setUsers(res.data.users);
      setServices(res.data.services);
      setRooms(res.data.rooms);
      setRoleHierarchy(res.data.roleHierarchy);
      setWorkingHours(res.data.workingHours);
      setTimeSlots(res.data.timeSlots);
      setReviews(res.data.reviews || []);
      setScheduleForm((current) => ({
        ...current,
        userId: current.userId || res.data.users.find((item) => ["dentist", "nurse", "receptionist"].includes(item.role))?._id || "",
        timeSlotId: current.timeSlotId || res.data.timeSlots[0]?._id || "",
        roomId: current.roomId || res.data.rooms[0]?._id || "",
        workDate: current.workDate || todayInput()
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (adminFeatures.some((item) => item.id === tab)) {
      setActiveFeature(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeFeature === "schedules" && !schedulesLoaded) {
      loadSchedules();
    }
  }, [activeFeature, schedulesLoaded]);

  async function loadSchedules() {
    try {
      const res = await api.get("/admin/staff-schedules", { params: { limit: 80 } });
      setSchedules(res.data.schedules);
      setSchedulesLoaded(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createService(event) {
    event.preventDefault();
    const validationError = firstError(
      validateName(serviceForm.name, "Tên dịch vụ"),
      validateNote(serviceForm.description),
      Number(serviceForm.durationMinutes) >= 10 ? "" : "Thời lượng dịch vụ tối thiểu 10 phút.",
      Number(serviceForm.price) >= 0 ? "" : "Giá dịch vụ không được âm."
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/services", {
        ...serviceForm,
        durationMinutes: Number(serviceForm.durationMinutes),
        price: Number(serviceForm.price)
      });
      setServiceForm({
        name: "",
        description: "",
        durationMinutes: 30,
        price: 0,
        requiresPrepayment: true,
        isConsultation: false
      });
      setMessage("Đã tạo dịch vụ.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createUser(event) {
    event.preventDefault();
    const validationError = firstError(validateName(userForm.fullName), validateEmail(userForm.email), validatePhone(userForm.phone));
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/users", {
        ...userForm,
        password: "Password123!"
      });
      setUserForm({ fullName: "", email: "", phone: "", role: "patient" });
      setMessage("Đã tạo tài khoản. Mật khẩu mặc định: Password123!");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateServiceActive(service, isActive) {
    const actionText = isActive ? "khôi phục" : "ẩn";
    if (!window.confirm(`Xác nhận ${actionText} dịch vụ ${service.name}?`)) return;

    try {
      setError("");
      setMessage("");
      if (isActive) {
        await api.patch(`/admin/services/${service._id}`, { isActive: true });
      } else {
        await api.delete(`/admin/services/${service._id}`);
      }
      setMessage(isActive ? "Đã khôi phục dịch vụ." : "Đã ẩn dịch vụ.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateUserStatus(id, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/users/${id}`, { status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function resetUserPassword(user) {
    const confirmed = window.confirm(`Đặt lại mật khẩu cho ${user.fullName}? Mật khẩu cũ sẽ không thể xem lại.`);
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");
      const res = await api.post(`/admin/users/${user._id}/reset-password`);
      setUsers((current) => current.map((item) => (item._id === user._id ? res.data.user : item)));
      setMessage(`Đã đặt lại mật khẩu cho ${user.fullName}. Mật khẩu tạm thời: ${res.data.temporaryPassword}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateRoom(roomId, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/rooms/${roomId}`, { status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createRoom(event) {
    event.preventDefault();
    const validationError = firstError(validateName(roomForm.name, "Tên phòng"), validateNote(roomForm.description));
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/rooms", {
        ...roomForm,
        assignedDentist: roomForm.assignedDentist || undefined
      });
      setRoomForm({ name: "", description: "", assignedDentist: "", status: "available" });
      setMessage("Đã tạo phòng khám.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createWorkingHour(event) {
    event.preventDefault();
    const validationError = firstError(
      validateName(workingHourForm.shiftName, "Tên ca"),
      validateTimeRange(workingHourForm.startTime, workingHourForm.endTime)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/working-hours", {
        ...workingHourForm,
        dayOfWeek: Number(workingHourForm.dayOfWeek)
      });
      setMessage("Đã thêm giờ làm.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleWorkingHour(id, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/working-hours/${id}`, { status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createSchedule(event) {
    event.preventDefault();
    const validationError = firstError(
      requireValue(scheduleForm.userId, "Nhân sự"),
      requireValue(scheduleForm.timeSlotId, "Ca làm"),
      validateDate(scheduleForm.workDate),
      validateTimeRange(scheduleForm.startTime, scheduleForm.endTime)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/staff-schedules", {
        ...scheduleForm,
        roomId: scheduleForm.roomId || undefined
      });
      setMessage("Đã tạo lịch nhân sự.");
      await loadSchedules();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateScheduleStatus(id, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/staff-schedules/${id}`, { status });
      await loadSchedules();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function exportReport() {
    try {
      setError("");
      setMessage("");
      const res = await api.get("/admin/reports/export");
      setReport(res.data);
      downloadJson(res.data, "das-report.json");
      setMessage("Đã tạo file báo cáo JSON.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadRevenueReport() {
    try {
      setError("");
      setMessage("");
      const res = await api.get("/admin/reports/revenue", { params: reportFilters });
      setRevenueReport(res.data);
      setMessage("Đã tải báo cáo doanh thu.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadPatientStatistics() {
    try {
      setError("");
      setMessage("");
      const res = await api.get("/admin/reports/patient-statistics", { params: reportFilters });
      setPatientStatistics(res.data);
      setMessage("Đã tải thống kê bệnh nhân.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const assignableUsers = users.filter((user) => staffRoles.includes(user.role));
  const dentistUsers = users.filter((user) => user.role === "dentist");

  return (
    <div className="page-grid">
      <Feedback error={error} message={message} />

      {activeFeature === "overview" && <AdminOverview loading={loading} roleHierarchy={roleHierarchy} stats={stats} />}

      {activeFeature === "users" && (
        <AccountManagement
          loading={loading}
          onCreateUser={createUser}
          onResetUserPassword={resetUserPassword}
          onUpdateUserStatus={updateUserStatus}
          onUserFormChange={(next) => setUserForm((current) => ({ ...current, ...next }))}
          userForm={userForm}
          users={users}
        />
      )}

      {activeFeature === "services" && (
        <DentalServiceManagement
          loading={loading}
          onCreateService={createService}
          onServiceFormChange={(next) => setServiceForm((current) => ({ ...current, ...next }))}
          onUpdateServiceActive={updateServiceActive}
          serviceForm={serviceForm}
          services={services}
        />
      )}

      {activeFeature === "rooms" && (
        <ClinicRoomManagement
          dentistUsers={dentistUsers}
          loading={loading}
          onCreateRoom={createRoom}
          onRoomFormChange={(next) => setRoomForm((current) => ({ ...current, ...next }))}
          onUpdateRoom={updateRoom}
          roomForm={roomForm}
          rooms={rooms}
        />
      )}

      {activeFeature === "workingHours" && (
        <ClinicWorkingHours
          loading={loading}
          onCreateWorkingHour={createWorkingHour}
          onToggleWorkingHour={toggleWorkingHour}
          onWorkingHourFormChange={(next) => setWorkingHourForm((current) => ({ ...current, ...next }))}
          timeSlots={timeSlots}
          workingHourForm={workingHourForm}
          workingHours={workingHours}
        />
      )}

      {activeFeature === "schedules" && (
        <StaffScheduleManagement
          assignableUsers={assignableUsers}
          onCreateSchedule={createSchedule}
          onScheduleFormChange={(next) => setScheduleForm((current) => ({ ...current, ...next }))}
          onUpdateScheduleStatus={updateScheduleStatus}
          rooms={rooms}
          scheduleForm={scheduleForm}
          schedules={schedules}
          schedulesLoaded={schedulesLoaded}
          timeSlots={timeSlots}
        />
      )}

      {activeFeature === "reports" && (
        <AdminReportPanel
          onExportReport={exportReport}
          onLoadPatientStatistics={loadPatientStatistics}
          onLoadRevenueReport={loadRevenueReport}
          onReportFiltersChange={(next) => setReportFilters((current) => ({ ...current, ...next }))}
          patientStatistics={patientStatistics}
          report={report}
          reportFilters={reportFilters}
          revenueReport={revenueReport}
          stats={stats}
        />
      )}

      {activeFeature === "reviews" && <AdminReviewList loading={loading} reviews={reviews} />}
    </div>
  );
}

function validateTimeRange(startTime, endTime) {
  if (!timePattern.test(startTime) || !timePattern.test(endTime)) return "Giờ phải theo định dạng HH:mm.";
  if (startTime >= endTime) return "Giờ bắt đầu phải trước giờ kết thúc.";
  if (!clinicSessions.some((session) => startTime >= session.start && endTime <= session.end)) {
    return "Thời gian phải nằm trong ca sáng 08:00 - 11:30 hoặc ca chiều 14:00 - 17:30.";
  }
  return "";
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
