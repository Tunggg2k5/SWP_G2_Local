import { CalendarDays, ClipboardList, PhoneCall } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatTime, todayInput } from "../../utils/format.js";
import ReceptionAppointmentFilters from "./ReceptionAppointmentFilters.jsx";
import ReceptionMetric from "./ReceptionMetric.jsx";

export default function ReceptionIntakeAppointments({
  acceptedCount,
  appointmentSearch,
  appointments,
  buildSlotKey,
  currentTime,
  date,
  duplicateBookingInfo,
  duplicateContactCount,
  loadRescheduleSlots,
  loading,
  pendingAppointments,
  pendingIntakeCount,
  receptionDecision,
  rejectedIntakeCount,
  rescheduleDates,
  rescheduleSlotKeys,
  rescheduleSlots,
  roomFilter,
  rooms,
  scheduleReceptionAppointment,
  setAppointmentSearch,
  setDate,
  setRescheduleDates,
  setRescheduleSlotKeys,
  setRescheduleSlots,
  setRoomFilter
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <ClipboardList size={20} />
        <h2>Lịch hẹn chờ xác nhận</h2>
      </div>
      <p className="muted">Thời gian thực: {currentTime.toLocaleString("vi-VN")}</p>

      <div className="metrics-grid compact-grid">
        <ReceptionMetric icon={ClipboardList} label="Chờ xác nhận" value={pendingIntakeCount} />
        <ReceptionMetric icon={ClipboardList} label="Đã từ chối" value={rejectedIntakeCount} />
        <ReceptionMetric icon={CalendarDays} label="Đã chấp nhận" value={acceptedCount} />
        <ReceptionMetric icon={PhoneCall} label="Cần liên hệ" value={duplicateContactCount} />
      </div>

      <ReceptionAppointmentFilters
        date={date}
        setDate={setDate}
        rooms={rooms}
        roomFilter={roomFilter}
        setRoomFilter={setRoomFilter}
        appointmentSearch={appointmentSearch}
        setAppointmentSearch={setAppointmentSearch}
      />

      {loading ? (
        <EmptyState title="Đang tải lịch hẹn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : pendingAppointments.length ? (
        <div className="appointment-list">
          {pendingAppointments.map((appointment) => {
            const duplicateInfo = duplicateBookingInfo(appointment, appointments);
            return (
              <article className={`appointment-card reception-appointment-card pending-intake ${duplicateInfo.shouldContact ? "needs-contact" : ""}`} key={appointment._id}>
                <div className="appointment-card-main">
                  <div className="patient-contact-row">
                    <div>
                      <h4>{appointment.patient?.fullName || "Bệnh nhân"}</h4>
                      <p>{appointment.patient?.phone || "Chưa có SĐT"}</p>
                    </div>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <div className="appointment-slot-box">
                    <strong>Slot bệnh nhân đã đặt</strong>
                    <span>{appointment.service?.name} - {formatDateTime(appointment.startAt)}</span>
                    <span>Giờ đến dự kiến: {formatDateTime(appointment.arrivalAt)}</span>
                    <span>Phòng: {appointment.room?.name || "-"} / Bác sĩ: {appointment.dentist?.fullName || "-"}</span>
                    <span>Bác sĩ mong muốn: {appointment.dentistPreference === "random" ? "Ngẫu nhiên, lễ tân xếp bác sĩ" : "Bệnh nhân đã chọn bác sĩ"}</span>
                    <span>Y tá: {appointment.nurse?.fullName || "Chưa phân công"} / Kênh: {appointment.channel === "online" ? "Online" : "Tại quầy"}</span>
                  </div>
                  {duplicateInfo.shouldContact && (
                    <div className="duplicate-contact-alert">
                      <PhoneCall size={16} />
                      <span>
                        Cần liên hệ: giờ này đã có {duplicateInfo.count} bệnh nhân chọn. Người đặt trước: {duplicateInfo.firstPatient}.
                      </span>
                    </div>
                  )}
                  {appointment.patientNote && <span className="mini">Ghi chú bệnh nhân: {appointment.patientNote}</span>}
                </div>
                <div className="appointment-card-actions">
                  <div className="appointment-intake-actions">
                    <button className="button small primary" onClick={() => receptionDecision(appointment, "confirmed")}>
                      {appointment.status === "rejected" ? "Chấp nhận lại" : "Chấp nhận"}
                    </button>
                    <button className="button small danger" disabled={appointment.status === "rejected"} onClick={() => receptionDecision(appointment, "rejected")}>
                      Từ chối
                    </button>
                  </div>
                  <div className="row-actions appointment-reschedule-tools">
                    <input
                      type="date"
                      min={todayInput()}
                      value={rescheduleDates[appointment._id] || ""}
                      onChange={(event) => {
                        setRescheduleDates((current) => ({ ...current, [appointment._id]: event.target.value }));
                        setRescheduleSlots((current) => ({ ...current, [appointment._id]: [] }));
                        setRescheduleSlotKeys((current) => ({ ...current, [appointment._id]: "" }));
                      }}
                    />
                    <button className="button small" onClick={() => loadRescheduleSlots(appointment)}>
                      Xem giờ/bác sĩ
                    </button>
                    {(rescheduleSlots[appointment._id] || []).length > 0 && (
                      <select
                        value={rescheduleSlotKeys[appointment._id] || ""}
                        onChange={(event) => setRescheduleSlotKeys((current) => ({ ...current, [appointment._id]: event.target.value }))}
                      >
                        {(rescheduleSlots[appointment._id] || []).map((slot) => (
                          <option value={buildSlotKey(slot)} key={buildSlotKey(slot)}>
                            {formatTime(slot.startAt)} - {slot.room.name} - {slot.dentist?.fullName}{slot.isBooked ? ` (${slot.bookedCount} lịch)` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    <button className="button small primary" onClick={() => scheduleReceptionAppointment(appointment)}>
                      Xếp lịch & gửi
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Không có lịch chờ xử lý" text="Các lịch đã chấp nhận sẽ nằm ở chức năng Check in." />
      )}
    </section>
  );
}
