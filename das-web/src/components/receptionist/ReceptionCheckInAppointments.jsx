import { CheckCheck, ClipboardCheck, ClipboardList } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";
import ReceptionAppointmentFilters from "./ReceptionAppointmentFilters.jsx";
import ReceptionMetric from "./ReceptionMetric.jsx";

export default function ReceptionCheckInAppointments({
  appointmentSearch,
  applyScheduleStatus,
  checkInAppointments,
  checkInCount,
  checkedInCount,
  date,
  defaultStatusAction,
  generateInvoice,
  inTreatmentCount,
  loading,
  markNoShow,
  processPayment,
  receptionStatusActionOptions,
  roomFilter,
  rooms,
  setAppointmentSearch,
  setDate,
  setRoomFilter,
  setStatusActions,
  statusActions
}) {
  return (
    <section className="panel reception-checkin-panel">
      <div className="section-title">
        <ClipboardCheck size={20} />
        <h2>Check in bệnh nhân</h2>
      </div>
      <p className="muted">Lịch đã được lễ tân xác nhận hoặc đặt hộ sẽ nằm ở đây. Cập nhật “Có mặt” để đưa bệnh nhân sang lịch khám theo thứ tự.</p>

      <div className="metrics-grid compact-grid">
        <ReceptionMetric icon={ClipboardCheck} label="Chờ check in" value={checkInCount} />
        <ReceptionMetric icon={CheckCheck} label="Đã có mặt" value={checkedInCount} />
        <ReceptionMetric icon={ClipboardList} label="Đang khám" value={inTreatmentCount} />
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
        <EmptyState title="Đang tải danh sách check in" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : checkInAppointments.length ? (
        <div className="appointment-list checkin-list">
          {checkInAppointments.map((appointment) => (
            <article className="appointment-card reception-checkin-card" key={appointment._id}>
              <div className="appointment-card-main">
                <div className="patient-contact-row">
                  <div>
                    <h4>{appointment.patient?.fullName || "Bệnh nhân"}</h4>
                    <p>{appointment.patient?.phone || "Chưa có SĐT"}</p>
                  </div>
                  <StatusBadge value={appointment.status} />
                </div>
                <div className="appointment-slot-box">
                  <strong>{appointment.service?.name || "Dịch vụ"}</strong>
                  <span>{formatDateTime(appointment.startAt)} - {appointment.room?.name || "Phòng khám"}</span>
                  <span>Bác sĩ: {appointment.dentist?.fullName || "-"}</span>
                  {appointment.patientNote && <span>Ghi chú: {appointment.patientNote}</span>}
                </div>
              </div>

              <div className="row-actions schedule-status-actions checkin-status-actions">
                <select
                  value={statusActions[appointment._id] || defaultStatusAction(appointment)}
                  onChange={(event) => setStatusActions((current) => ({ ...current, [appointment._id]: event.target.value }))}
                >
                  {receptionStatusActionOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button className="button small primary" onClick={() => applyScheduleStatus(appointment)}>
                  Cập nhật
                </button>
                <button className="button small ghost" type="button" onClick={() => generateInvoice(appointment)}>
                  Tạo hóa đơn
                </button>
                <button className="button small secondary" type="button" onClick={() => processPayment(appointment)}>
                  Thanh toán
                </button>
                <button className="button small danger" type="button" onClick={() => markNoShow(appointment)}>
                  Vắng mặt
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Không có lịch chờ check in" text="Lịch sau khi xác nhận hoặc đặt hộ sẽ xuất hiện ở đây." />
      )}
    </section>
  );
}
