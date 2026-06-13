import { Fragment } from "react";
import { CalendarDays, CheckCheck, ClipboardList } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatTime } from "../../utils/format.js";
import ReceptionAppointmentFilters from "./ReceptionAppointmentFilters.jsx";
import ReceptionMetric from "./ReceptionMetric.jsx";

export default function ReceptionClinicalQueue({
  appointmentSearch,
  appointmentsByDentist,
  applyScheduleStatus,
  checkedInCount,
  clinicalQueueAppointments,
  date,
  defaultStatusAction,
  dentistColumns,
  inTreatmentCount,
  isLockedScheduleAppointment,
  loading,
  queueRowCount,
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
    <section className="panel reception-schedule-panel">
      <div className="section-title">
        <CalendarDays size={20} />
        <h2>Lịch khám theo thứ tự check-in</h2>
      </div>

      <div className="metrics-grid compact-grid">
        <ReceptionMetric icon={CalendarDays} label="Lịch trong hàng đợi" value={clinicalQueueAppointments.length} />
        <ReceptionMetric icon={CheckCheck} label="Có mặt" value={checkedInCount} />
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
        <EmptyState title="Đang tải lịch khám" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : dentistColumns.length ? (
        <div className="reception-schedule-table-wrapper">
          <div
            className="reception-schedule-grid"
            style={{ gridTemplateColumns: `74px repeat(${dentistColumns.length}, minmax(220px, 1fr))` }}
          >
            <div className="schedule-head schedule-time-head">STT</div>
            {dentistColumns.map((dentist) => (
              <div className="schedule-head dentist-head" key={dentist._id}>
                <strong>{dentist.fullName}</strong>
                <span>{dentist.roomName || "Đang trực"}</span>
              </div>
            ))}

            {Array.from({ length: queueRowCount }, (_, rowIndex) => (
              <Fragment key={`queue-row-${rowIndex}`}>
                <div className="schedule-time-cell">#{rowIndex + 1}</div>
                {dentistColumns.map((dentist) => {
                  const appointment = appointmentsByDentist.get(dentist._id)?.[rowIndex];
                  const locked = appointment ? isLockedScheduleAppointment(appointment) : false;
                  return (
                    <div className="schedule-cell" key={`${rowIndex}-${dentist._id}`}>
                      {appointment ? (
                        <article className={`schedule-cell-card ${locked ? "locked" : ""}`} key={appointment._id}>
                          <div>
                            <strong>{appointment.patient?.fullName || "Bệnh nhân"}</strong>
                            <span>{appointment.service?.name || "Dịch vụ"} / {appointment.room?.name || "Phòng"}</span>
                            <span>Giờ hẹn: {formatTime(appointment.startAt)}</span>
                            {appointment.checkedInAt && <span>Check-in: {formatTime(appointment.checkedInAt)}</span>}
                            <StatusBadge value={appointment.status} />
                            {locked && <small>Lịch đã hủy hoặc bị từ chối, không thể đổi trạng thái.</small>}
                          </div>
                          <div className="row-actions schedule-status-actions">
                            <select
                              value={statusActions[appointment._id] || defaultStatusAction(appointment)}
                              disabled={locked}
                              onChange={(event) => setStatusActions((current) => ({ ...current, [appointment._id]: event.target.value }))}
                            >
                              {receptionStatusActionOptions.map((option) => (
                                <option value={option.value} key={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button className="button small" disabled={locked} onClick={() => applyScheduleStatus(appointment)}>
                              Cập nhật
                            </button>
                          </div>
                        </article>
                      ) : (
                        <span className="schedule-empty-cell">Chưa có bệnh nhân</span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="Chưa có bác sĩ trong hàng đợi" text="Bảng này sẽ hiển thị khi có bác sĩ hoặc phòng khám được gán trong dữ liệu hệ thống." />
      )}
    </section>
  );
}
