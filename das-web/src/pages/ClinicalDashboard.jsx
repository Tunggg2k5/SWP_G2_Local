import { CalendarPlus, ClipboardPenLine, DoorOpen, FileText, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClinicalTreatmentForm from "../components/clinical/ClinicalTreatmentForm.jsx";
import ClinicalTreatmentHistory from "../components/clinical/ClinicalTreatmentHistory.jsx";
import ClinicalWorkSchedule from "../components/clinical/ClinicalWorkSchedule.jsx";
import FollowUpAppointmentForm from "../components/clinical/dentist/FollowUpAppointmentForm.jsx";
import ClinicalRoomStatus from "../components/clinical/nurse/ClinicalRoomStatus.jsx";
import Feedback from "../components/Feedback.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { todayInput } from "../utils/format.js";
import { bookingSlotOptions, toClinicIso } from "./BookingPage.jsx";

function getClinicalFeatures(role) {
  return [
    { id: "schedule", label: "Lịch khám", icon: Stethoscope },
    { id: "treatment", label: role === "dentist" ? "Kế hoạch điều trị" : "Cập nhật điều trị", icon: ClipboardPenLine },
    ...(role === "dentist" ? [{ id: "followUp", label: "Tái khám", icon: CalendarPlus }] : []),
    ...(role === "nurse" ? [{ id: "rooms", label: "Phòng khám", icon: DoorOpen }] : []),
    { id: "records", label: "Lịch sử điều trị", icon: FileText }
  ];
}

const defaultRecordForm = {
  appointmentId: "",
  bloodPressure: "",
  heartRate: "",
  spo2: "",
  temperature: "",
  respiratoryRate: "",
  diagnosis: "",
  treatmentResult: "",
  treatmentNote: "",
  treatmentPlan: "",
  estimatedCost: ""
};

const defaultFollowUpForm = {
  appointmentId: "",
  serviceId: "",
  date: todayInput(),
  time: bookingSlotOptions[0].value,
  roomId: "",
  note: ""
};

export default function ClinicalDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const clinicalFeatures = useMemo(() => getClinicalFeatures(user?.role), [user?.role]);
  const [activeFeature, setActiveFeature] = useState("schedule");
  const [date, setDate] = useState(todayInput());
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [staffSchedules, setStaffSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordForm, setRecordForm] = useState(defaultRecordForm);
  const [followUpForm, setFollowUpForm] = useState(defaultFollowUpForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/clinical/dashboard", { params: { date } });
      const nextAppointments = res.data.appointments || [];
      const nextRooms = res.data.rooms || [];
      const nextServices = res.data.services || [];

      setAppointments(nextAppointments);
      setRecords(res.data.records || []);
      setRooms(nextRooms);
      setServices(nextServices);
      setStaffSchedules(res.data.staffSchedules || []);
      setRecordForm((current) => ({
        ...current,
        appointmentId: current.appointmentId || nextAppointments[0]?._id || ""
      }));
      setFollowUpForm((current) => {
        const appointment = nextAppointments.find((item) => item._id === current.appointmentId) || nextAppointments[0];
        return {
          ...current,
          appointmentId: current.appointmentId || appointment?._id || "",
          serviceId: current.serviceId || appointment?.service?._id || nextServices[0]?._id || "",
          roomId: current.roomId || appointment?.room?._id || findRoomForDentist(appointment?.dentist?._id, nextRooms)?._id || nextRooms[0]?._id || ""
        };
      });
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
    if (tab && clinicalFeatures.some((item) => item.id === tab)) {
      setActiveFeature(tab);
    } else if (!clinicalFeatures.some((item) => item.id === activeFeature)) {
      setActiveFeature("schedule");
    }
  }, [activeFeature, clinicalFeatures, location.search]);

  const clinicalColumns = useMemo(() => buildClinicalColumns(appointments, rooms), [appointments, rooms]);
  const clinicalRows = useMemo(() => buildClinicalRows(appointments, clinicalColumns), [appointments, clinicalColumns]);
  const selectedAppointment = appointments.find((appointment) => appointment._id === recordForm.appointmentId);
  const selectedFollowUpAppointment = appointments.find((appointment) => appointment._id === followUpForm.appointmentId);
  const displayRecords = history.length ? history : records;

  function updateRecord(field, value) {
    setRecordForm((current) => ({ ...current, [field]: value }));
  }

  function updateFollowUp(field, value) {
    setFollowUpForm((current) => ({ ...current, [field]: value }));
  }

  function openFeature(featureId) {
    setActiveFeature(featureId);
    navigate(`/dashboard?tab=${featureId}`, { replace: true });
  }

  function selectTreatmentAppointment(appointment) {
    setRecordForm((current) => ({ ...current, appointmentId: appointment._id }));
    openFeature("treatment");
  }

  function selectFollowUpAppointment(appointmentId) {
    const appointment = appointments.find((item) => item._id === appointmentId);
    setFollowUpForm((current) => ({
      ...current,
      appointmentId,
      serviceId: appointment?.service?._id || current.serviceId,
      roomId: appointment?.room?._id || findRoomForDentist(appointment?.dentist?._id, rooms)?._id || current.roomId
    }));
  }

  async function submitRecord(event) {
    event.preventDefault();
    if (!recordForm.appointmentId) {
      setError("Chọn lịch khám trước khi lưu điều trị.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const payload = user?.role === "nurse"
        ? {
            vitalSigns: {
              bloodPressure: recordForm.bloodPressure,
              heartRate: recordForm.heartRate,
              spo2: recordForm.spo2,
              temperature: recordForm.temperature,
              respiratoryRate: recordForm.respiratoryRate
            },
            treatmentNote: recordForm.treatmentNote
          }
        : {
            diagnosis: recordForm.diagnosis,
            treatmentResult: recordForm.treatmentResult,
            treatmentNote: recordForm.treatmentNote,
            treatmentPlan: recordForm.treatmentPlan,
            estimatedCost: Number(recordForm.estimatedCost || 0)
          };
      await api.put(`/clinical/appointments/${recordForm.appointmentId}/treatment-record`, payload);
      setMessage(user?.role === "nurse" ? "Đã lưu thông tin chung." : "Đã lưu thông tin điều trị.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function submitFollowUp(event) {
    event.preventDefault();
    if (!followUpForm.appointmentId || !followUpForm.serviceId || !followUpForm.date || !followUpForm.time || !followUpForm.roomId) {
      setError("Chọn bệnh nhân, dịch vụ, ngày giờ và bác sĩ/phòng trước khi đặt tái khám.");
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post(`/clinical/appointments/${followUpForm.appointmentId}/follow-up`, {
        serviceId: followUpForm.serviceId,
        date: followUpForm.date,
        startAt: toClinicIso(followUpForm.date, followUpForm.time),
        roomId: followUpForm.roomId,
        note: followUpForm.note
      });
      setMessage("Đã đặt lịch tái khám và gửi thông báo cho bệnh nhân.");
      setFollowUpForm((current) => ({ ...current, note: "" }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function viewPatientHistory(patientId) {
    if (!patientId) {
      setError("Không tìm thấy bệnh nhân của lịch khám này.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const res = await api.get(`/clinical/patients/${patientId}/history`);
      setHistory(res.data.records || []);
      openFeature("records");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function setRoomStatus(roomId, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/clinical/rooms/${roomId}/status`, { status });
      setMessage("Đã cập nhật trạng thái phòng khám.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="page-grid clinical-dashboard">
      <Feedback error={error} message={message} />

      {activeFeature === "schedule" && (
        <ClinicalWorkSchedule
          appointments={appointments}
          canEditAppointment={canEditAppointment}
          clinicalColumns={clinicalColumns}
          clinicalRows={clinicalRows}
          date={date}
          isLockedAppointment={isLockedAppointment}
          loading={loading}
          onDateChange={setDate}
          onSelectTreatment={selectTreatmentAppointment}
          onViewPatientHistory={viewPatientHistory}
          staffSchedules={staffSchedules}
          user={user}
        />
      )}

      {activeFeature === "treatment" && (
        <ClinicalTreatmentForm
          appointments={appointments}
          form={recordForm}
          onChange={updateRecord}
          onSubmit={submitRecord}
          selectedAppointment={selectedAppointment}
          user={user}
        />
      )}

      {activeFeature === "followUp" && user?.role === "dentist" && (
        <FollowUpAppointmentForm
          appointments={appointments}
          canEditAppointment={canEditAppointment}
          form={followUpForm}
          onChange={updateFollowUp}
          onSelectAppointment={selectFollowUpAppointment}
          onSubmit={submitFollowUp}
          rooms={rooms}
          selectedAppointment={selectedFollowUpAppointment}
          services={services}
          user={user}
        />
      )}

      {activeFeature === "records" && (
        <ClinicalTreatmentHistory loading={loading} records={displayRecords} />
      )}

      {activeFeature === "rooms" && user?.role === "nurse" && (
        <ClinicalRoomStatus loading={loading} onSetRoomStatus={setRoomStatus} rooms={rooms} />
      )}
    </div>
  );
}

function buildClinicalColumns(appointments, rooms) {
  const columns = new Map();
  rooms.forEach((room) => {
    if (room.assignedDentist?._id && !columns.has(room.assignedDentist._id)) {
      columns.set(room.assignedDentist._id, {
        _id: room.assignedDentist._id,
        fullName: room.assignedDentist.fullName,
        roomName: room.name
      });
    }
  });
  appointments.forEach((appointment) => {
    if (appointment.dentist?._id && !columns.has(appointment.dentist._id)) {
      columns.set(appointment.dentist._id, {
        _id: appointment.dentist._id,
        fullName: appointment.dentist.fullName,
        roomName: appointment.room?.name
      });
    }
  });

  return Array.from(columns.values()).slice(0, 3);
}

function buildClinicalRows(appointments, columns) {
  const grouped = new Map(columns.map((column) => [column._id, []]));
  appointments
    .slice()
    .sort((first, second) => queueSortValue(first) - queueSortValue(second))
    .forEach((appointment) => {
      const dentistId = appointment.dentist?._id;
      if (grouped.has(dentistId)) {
        grouped.get(dentistId).push(appointment);
      }
    });

  const rowCount = Math.max(1, ...columns.map((column) => grouped.get(column._id)?.length || 0));
  return Array.from({ length: rowCount }, (_, index) => ({
    index: index + 1,
    cells: columns.map((column) => grouped.get(column._id)?.[index] || null)
  }));
}

function queueSortValue(appointment) {
  return new Date(appointment.checkedInAt || appointment.checkInTime || appointment.startAt || 0).getTime();
}

function findRoomForDentist(dentistId, rooms) {
  if (!dentistId) return null;
  return rooms.find((room) => room.assignedDentist?._id === dentistId || room.assignedDentist === dentistId);
}

function canEditAppointment(user, appointment) {
  return user?.role === "admin" || user?.role === "nurse" || appointment.dentist?._id === user?._id;
}

function isLockedAppointment(appointment) {
  return ["cancelled", "no_show", "rejected"].includes(appointment.status);
}
