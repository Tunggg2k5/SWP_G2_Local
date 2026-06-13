import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import BookAppointmentForPatientForm from "../components/receptionist/BookAppointmentForPatientForm.jsx";
import ConsultationRequestList from "../components/receptionist/ConsultationRequestList.jsx";
import PatientAccountSearch from "../components/receptionist/PatientAccountSearch.jsx";
import ReceptionCheckInAppointments from "../components/receptionist/ReceptionCheckInAppointments.jsx";
import ReceptionClinicalQueue from "../components/receptionist/ReceptionClinicalQueue.jsx";
import ReceptionIntakeAppointments from "../components/receptionist/ReceptionIntakeAppointments.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { formatTime, todayInput } from "../utils/format.js";
import { firstError, requireValue, validateDate, validateName, validateNote, validatePhone } from "../utils/validation.js";

const receptionStatusActionOptions = [
  { value: "confirmed", label: "Đang chờ" },
  { value: "checked_in", label: "Có mặt" },
  { value: "no_show", label: "Vắng mặt" },
  { value: "in_treatment", label: "Đang khám" },
  { value: "completed", label: "Hoàn tất" }
];

const checkInStatuses = new Set(["scheduled", "confirmed", "no_show"]);
const clinicalQueueStatuses = new Set(["checked_in", "in_treatment", "completed"]);
const acceptedStatuses = new Set([...checkInStatuses, ...clinicalQueueStatuses]);
const statusActionValues = new Set(receptionStatusActionOptions.map((option) => option.value));
const intakeStatuses = new Set(["pending", "rejected"]);
const duplicateContactStatuses = new Set(["pending", "scheduled", "confirmed", "checked_in", "in_treatment"]);

const genderOptions = [
  { value: "unknown", label: "Chưa chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" }
];

export default function ReceptionistDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState("appointments");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [date, setDate] = useState(todayInput());
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [accountMode, setAccountMode] = useState("existing");
  const [newPatient, setNewPatient] = useState({ fullName: "", phone: "", gender: "unknown", createAccount: false });
  const [booking, setBooking] = useState({ patientId: "", serviceId: "", note: "" });
  const [resetPasswords, setResetPasswords] = useState({});
  const [rescheduleDates, setRescheduleDates] = useState({});
  const [rescheduleSlots, setRescheduleSlots] = useState({});
  const [rescheduleSlotKeys, setRescheduleSlotKeys] = useState({});
  const [statusActions, setStatusActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/reception/dashboard", { params: { date } });

      setAppointments(res.data.appointments);
      setPatients(res.data.patients);
      setServices(res.data.services);
      setConsultations(res.data.consultations);
      setRooms(res.data.rooms);
      setBooking((current) => ({
        ...current,
        patientId: current.patientId || res.data.patients[0]?._id || "",
        serviceId: current.serviceId || res.data.services[0]?._id || ""
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [date]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (["appointments", "checkin", "schedule", "booking", "accounts", "consultations"].includes(tab)) {
      setActiveFeature(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refresh = setInterval(load, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(refresh);
    };
  }, [date]);

  async function createBooking(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const commonError = firstError(requireValue(booking.serviceId, "Dịch vụ"), validateDate(date), validateNote(booking.note));
    const patientError =
      accountMode === "existing"
        ? requireValue(booking.patientId, "Bệnh nhân")
        : firstError(validateName(newPatient.fullName), validatePhone(newPatient.phone), requireValue(newPatient.gender, "Giới tính"));
    const validationError = firstError(commonError, patientError);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!window.confirm("Xác nhận đặt lịch hộ bệnh nhân?")) return;

    try {
      let patientId = booking.patientId;

      if (accountMode === "new") {
        const res = await api.post("/reception/patients", newPatient);
        patientId = res.data.patient._id;
        setNewPatient({ fullName: "", phone: "", gender: "unknown", createAccount: false });
      }

      await api.post("/appointments", {
        patientId,
        serviceId: booking.serviceId,
        date,
        channel: "offline",
        note: booking.note
      });
      setMessage("Đã đặt lịch hộ bệnh nhân. Chuyển sang màn Check in.");
      setActiveFeature("checkin");
      navigate("/dashboard?tab=checkin", { replace: true });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateAppointment(id, status, note = "Lễ tân cập nhật trạng thái lịch khám.") {
    if (!window.confirm("Xác nhận cập nhật trạng thái lịch hẹn?")) return null;

    try {
      const res = await api.patch(`/appointments/${id}/status`, { status, note });
      setMessage("Đã cập nhật trạng thái lịch hẹn.");
      load();
      return res.data.appointment;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    }
  }

  async function receptionDecision(appointment, status) {
    const labels = {
      confirmed: "chấp nhận lịch hẹn này",
      rejected: "từ chối lịch hẹn này"
    };

    if (!window.confirm(`Xác nhận ${labels[status]}?`)) return;

    try {
      await api.patch(`/appointments/${appointment._id}/status`, {
        status,
        note: `Lễ tân ${labels[status]}.`
      });
      setMessage(status === "confirmed" ? "Đã chấp nhận lịch hẹn. Chuyển sang màn Check in." : "Đã từ chối lịch hẹn.");
      if (status === "confirmed") {
        setActiveFeature("checkin");
        navigate("/dashboard?tab=checkin", { replace: true });
      }
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function applyScheduleStatus(appointment) {
    if (isLockedScheduleAppointment(appointment)) {
      setError("Lịch này đã hủy hoặc bị từ chối nên không thể thay đổi trạng thái.");
      return;
    }

    const value = statusActions[appointment._id] || defaultStatusAction(appointment);
    const updated = await updateAppointment(appointment._id, value);
    if (updated && clinicalQueueStatuses.has(value)) {
      setMessage("Đã cập nhật bệnh nhân vào lịch khám theo thứ tự.");
      setActiveFeature("schedule");
      navigate("/dashboard?tab=schedule", { replace: true });
    }
  }

  async function markNoShow(appointment) {
    if (!window.confirm("Xác nhận đánh dấu vắng mặt?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/no-show`, { note: "Lễ tân đánh dấu bệnh nhân vắng mặt." });
      setMessage("Đã đánh dấu bệnh nhân vắng mặt.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function generateInvoice(appointment) {
    if (!window.confirm("Tạo hóa đơn cho lịch hẹn này?")) return;

    try {
      await api.post(`/appointments/${appointment._id}/invoice`);
      setMessage("Đã tạo hóa đơn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function processPayment(appointment) {
    if (!window.confirm("Xác nhận đã thu tiền cho lịch hẹn này?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/payment`, { paymentMethod: "cash" });
      setMessage("Đã ghi nhận thanh toán.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function scheduleReceptionAppointment(appointment) {
    const nextDate = rescheduleDates[appointment._id];
    const slotKey = rescheduleSlotKeys[appointment._id];
    const slot = (rescheduleSlots[appointment._id] || []).find((item) => buildSlotKey(item) === slotKey);
    if (!nextDate) {
      setError("Chọn ngày để xếp lịch cho bệnh nhân.");
      return;
    }
    if (!slot) {
      setError("Chọn giờ khám và bác sĩ trước khi gửi lại lịch cho bệnh nhân.");
      return;
    }

    if (!window.confirm(`Xếp lịch ${formatTime(slot.startAt)} với ${slot.dentist?.fullName || "bác sĩ"} và gửi thông báo cho bệnh nhân?`)) return;

    try {
      await api.patch(`/appointments/${appointment._id}/reception-schedule`, {
        serviceId: appointment.service?._id,
        date: nextDate,
        startAt: slot.startAt,
        roomId: slot.room._id,
        note: "Lễ tân đã xếp giờ khám và bác sĩ cho bệnh nhân."
      });
      setMessage("Đã xếp lịch và gửi thông tin lịch hẹn cho bệnh nhân.");
      setRescheduleDates((current) => ({ ...current, [appointment._id]: "" }));
      setRescheduleSlots((current) => ({ ...current, [appointment._id]: [] }));
      setRescheduleSlotKeys((current) => ({ ...current, [appointment._id]: "" }));
      setActiveFeature("checkin");
      navigate("/dashboard?tab=checkin", { replace: true });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadRescheduleSlots(appointment) {
    const nextDate = rescheduleDates[appointment._id];
    if (!nextDate) {
      setError("Chọn ngày mới để xem slot trống.");
      return;
    }

    try {
      const res = await api.get("/availability", { params: { serviceId: appointment.service?._id, date: nextDate, includeBooked: "true" } });
      const slots = res.data.slots || [];
      setRescheduleSlots((current) => ({ ...current, [appointment._id]: slots }));
      setRescheduleSlotKeys((current) => ({ ...current, [appointment._id]: slots[0] ? buildSlotKey(slots[0]) : "" }));
      if (!slots.length) setMessage("Ngày này chưa có slot trống phù hợp.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateConsultation(id, status) {
    if (!window.confirm("Xác nhận cập nhật yêu cầu tư vấn?")) return;

    try {
      await api.patch(`/reception/consultations/${id}`, { status });
      setMessage("Đã cập nhật yêu cầu tư vấn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function resetPatientPassword(patient) {
    const password = resetPasswords[patient._id] || "Password123!";
    if (!window.confirm(`Xác nhận reset mật khẩu cho ${patient.fullName}?`)) return;

    try {
      const res = await api.patch(`/reception/patients/${patient._id}/reset-password`, { password });
      setMessage(`Đã reset mật khẩu cho ${res.data.patient.fullName}. Mật khẩu tạm: ${res.data.temporaryPassword}`);
      setResetPasswords((current) => ({ ...current, [patient._id]: "" }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const filteredBaseAppointments = appointments.filter((appointment) => matchesAppointmentFilters(appointment, appointmentSearch, roomFilter));
  const pendingAppointments = filteredBaseAppointments.filter((appointment) => intakeStatuses.has(appointment.status));
  const checkInAppointments = filteredBaseAppointments.filter((appointment) => checkInStatuses.has(appointment.status));
  const clinicalQueueAppointments = filteredBaseAppointments.filter((appointment) => clinicalQueueStatuses.has(appointment.status));
  const pendingIntakeCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const rejectedIntakeCount = appointments.filter((appointment) => appointment.status === "rejected").length;
  const acceptedCount = appointments.filter((appointment) => acceptedStatuses.has(appointment.status)).length;
  const checkInCount = appointments.filter((appointment) => checkInStatuses.has(appointment.status)).length;
  const duplicateContactCount = pendingAppointments.filter((appointment) => duplicateBookingInfo(appointment, appointments).shouldContact).length;
  const checkedInCount = appointments.filter((appointment) => appointment.status === "checked_in").length;
  const inTreatmentCount = appointments.filter((appointment) => appointment.status === "in_treatment").length;
  const patientKeyword = patientSearch.trim().toLowerCase();
  const selectablePatients = patients.filter((patient) => {
    if (!patientKeyword) return true;
    return [patient.fullName, patient.phone].filter(Boolean).join(" ").toLowerCase().includes(patientKeyword);
  });

  const dentistColumns = useMemo(() => {
    const roomDentists = rooms
      .filter((room) => room.assignedDentist?._id)
      .map((room) => ({ ...room.assignedDentist, roomName: room.name }));
    const appointmentDentists = clinicalQueueAppointments
      .filter((appointment) => appointment.dentist?._id)
      .map((appointment) => ({ ...appointment.dentist, roomName: appointment.room?.name }));

    return Array.from(new Map([...roomDentists, ...appointmentDentists].filter((dentist) => dentist?._id).map((dentist) => [dentist._id, dentist])).values()).slice(0, 3);
  }, [rooms, clinicalQueueAppointments]);

  const appointmentsByDentist = useMemo(() => {
    const map = new Map(dentistColumns.map((dentist) => [dentist._id, []]));
    clinicalQueueAppointments
      .filter((appointment) => appointment.dentist?._id && map.has(appointment.dentist._id))
      .sort(compareQueueOrder)
      .forEach((appointment) => {
        map.get(appointment.dentist._id).push(appointment);
      });
    return map;
  }, [dentistColumns, clinicalQueueAppointments]);

  const queueRowCount = Math.max(1, ...Array.from(appointmentsByDentist.values()).map((items) => items.length));

  return (
    <div className="page-grid">
      <Feedback error={error} message={message} onClear={() => { setError(""); setMessage(""); }} />

      {activeFeature === "appointments" && (
        <ReceptionIntakeAppointments
          acceptedCount={acceptedCount}
          appointmentSearch={appointmentSearch}
          appointments={appointments}
          buildSlotKey={buildSlotKey}
          currentTime={currentTime}
          date={date}
          duplicateBookingInfo={duplicateBookingInfo}
          duplicateContactCount={duplicateContactCount}
          loadRescheduleSlots={loadRescheduleSlots}
          loading={loading}
          pendingAppointments={pendingAppointments}
          pendingIntakeCount={pendingIntakeCount}
          receptionDecision={receptionDecision}
          rejectedIntakeCount={rejectedIntakeCount}
          rescheduleDates={rescheduleDates}
          rescheduleSlotKeys={rescheduleSlotKeys}
          rescheduleSlots={rescheduleSlots}
          roomFilter={roomFilter}
          rooms={rooms}
          scheduleReceptionAppointment={scheduleReceptionAppointment}
          setAppointmentSearch={setAppointmentSearch}
          setDate={setDate}
          setRescheduleDates={setRescheduleDates}
          setRescheduleSlotKeys={setRescheduleSlotKeys}
          setRescheduleSlots={setRescheduleSlots}
          setRoomFilter={setRoomFilter}
        />
      )}

      {activeFeature === "checkin" && (
        <ReceptionCheckInAppointments
          appointmentSearch={appointmentSearch}
          applyScheduleStatus={applyScheduleStatus}
          checkInAppointments={checkInAppointments}
          checkInCount={checkInCount}
          checkedInCount={checkedInCount}
          date={date}
          defaultStatusAction={defaultStatusAction}
          generateInvoice={generateInvoice}
          inTreatmentCount={inTreatmentCount}
          loading={loading}
          markNoShow={markNoShow}
          processPayment={processPayment}
          receptionStatusActionOptions={receptionStatusActionOptions}
          roomFilter={roomFilter}
          rooms={rooms}
          setAppointmentSearch={setAppointmentSearch}
          setDate={setDate}
          setRoomFilter={setRoomFilter}
          setStatusActions={setStatusActions}
          statusActions={statusActions}
        />
      )}

      {activeFeature === "schedule" && (
        <ReceptionClinicalQueue
          appointmentSearch={appointmentSearch}
          appointmentsByDentist={appointmentsByDentist}
          applyScheduleStatus={applyScheduleStatus}
          checkedInCount={checkedInCount}
          clinicalQueueAppointments={clinicalQueueAppointments}
          date={date}
          defaultStatusAction={defaultStatusAction}
          dentistColumns={dentistColumns}
          inTreatmentCount={inTreatmentCount}
          isLockedScheduleAppointment={isLockedScheduleAppointment}
          loading={loading}
          queueRowCount={queueRowCount}
          receptionStatusActionOptions={receptionStatusActionOptions}
          roomFilter={roomFilter}
          rooms={rooms}
          setAppointmentSearch={setAppointmentSearch}
          setDate={setDate}
          setRoomFilter={setRoomFilter}
          setStatusActions={setStatusActions}
          statusActions={statusActions}
        />
      )}

      {activeFeature === "booking" && (
        <BookAppointmentForPatientForm
          accountMode={accountMode}
          booking={booking}
          date={date}
          genderOptions={genderOptions}
          newPatient={newPatient}
          onAccountModeChange={setAccountMode}
          onBookingChange={(next) => setBooking((current) => ({ ...current, ...next }))}
          onDateChange={setDate}
          onNewPatientChange={(next) => setNewPatient((current) => ({ ...current, ...next }))}
          onSubmit={createBooking}
          patientSearch={patientSearch}
          selectablePatients={selectablePatients}
          services={services}
          setPatientSearch={setPatientSearch}
        />
      )}

      {activeFeature === "accounts" && (
        <PatientAccountSearch
          loading={loading}
          onResetPassword={resetPatientPassword}
          patientSearch={patientSearch}
          resetPasswords={resetPasswords}
          selectablePatients={selectablePatients}
          setPatientSearch={setPatientSearch}
          setResetPasswords={setResetPasswords}
        />
      )}

      {activeFeature === "consultations" && (
        <ConsultationRequestList
          consultations={consultations}
          loading={loading}
          onUpdateConsultation={updateConsultation}
        />
      )}
    </div>
  );
}

function matchesAppointmentFilters(appointment, appointmentSearch, roomFilter) {
  const keyword = appointmentSearch.trim().toLowerCase();
  const matchesRoom = roomFilter === "all" || appointment.room?._id === roomFilter;
  const searchableText = [
    appointment.patient?.fullName,
    appointment.patient?.phone,
    appointment.service?.name,
    appointment.room?.name,
    appointment.dentist?.fullName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return matchesRoom && (!keyword || searchableText.includes(keyword));
}

function isLockedScheduleAppointment(appointment) {
  return ["cancelled", "rejected"].includes(appointment.status);
}

function compareQueueOrder(a, b) {
  const aCheckedIn = Boolean(a.checkedInAt || a.checkInTime);
  const bCheckedIn = Boolean(b.checkedInAt || b.checkInTime);
  if (aCheckedIn !== bCheckedIn) return aCheckedIn ? -1 : 1;

  const aTime = new Date(a.checkInTime || a.checkedInAt || a.startAt || a.createdAt).getTime();
  const bTime = new Date(b.checkInTime || b.checkedInAt || b.startAt || b.createdAt).getTime();
  return aTime - bTime;
}

function duplicateBookingInfo(appointment, appointments) {
  const dentistId = appointment.dentist?._id;
  const startTime = new Date(appointment.startAt).getTime();
  if (!dentistId || !startTime) return { count: 0, firstPatient: "-", shouldContact: false };

  const matches = appointments
    .filter(
      (item) =>
        item.dentist?._id === dentistId &&
        new Date(item.startAt).getTime() === startTime &&
        duplicateContactStatuses.has(item.status)
    )
    .sort((a, b) => new Date(a.createdAt || a.bookingDate || a.startAt) - new Date(b.createdAt || b.bookingDate || b.startAt));
  const position = matches.findIndex((item) => item._id === appointment._id);

  return {
    count: matches.length,
    firstPatient: matches[0]?.patient?.fullName || "bệnh nhân đặt trước",
    shouldContact: matches.length > 1 && position > 0
  };
}

function defaultStatusAction(appointment) {
  return statusActionValues.has(appointment.status) ? appointment.status : "confirmed";
}

function buildSlotKey(slot) {
  return `${slot.startAt}|${slot.room?._id}`;
}
