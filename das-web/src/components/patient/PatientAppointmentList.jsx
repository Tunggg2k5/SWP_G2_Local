import { CalendarClock } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney, todayInput } from "../../utils/format.js";
import { bookingSlotOptions } from "../../pages/BookingPage.jsx";

export default function PatientAppointmentList({
  appointments,
  canModifyAppointment,
  cancelAppointment,
  dentistOptions,
  invoiceByAppointment,
  loading,
  rescheduleAppointment,
  rescheduleForms,
  reviewForms,
  submitReview,
  updateRescheduleForm,
  updateReviewForm
}) {
  return (
    <section className="panel" id="appointments">
      <div className="section-title">
        <CalendarClock size={20} />
        <h2>Lịch hẹn của tôi</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải lịch hẹn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : appointments.length ? (
        <div className="appointment-list">
          {appointments.map((appointment) => {
            const invoice = invoiceByAppointment.get(appointment._id);
            const canReview = appointment.status === "completed";
            const canModify = canModifyAppointment(appointment);
            const reviewForm = reviewForms[appointment._id] || { rating: 5, comment: "" };
            const rescheduleForm = rescheduleForms[appointment._id] || {
              date: todayInput(),
              time: bookingSlotOptions[0].value,
              dentistId: appointment.dentist?._id || dentistOptions[0]?._id || ""
            };

            return (
              <article className="appointment-card patient-appointment-card" key={appointment._id}>
                <div>
                  <h4>{appointment.service?.name}</h4>
                  <p>{formatDateTime(appointment.startAt)} - {appointment.room?.name}</p>
                  <span className="mini">Giờ đến: {formatDateTime(appointment.arrivalAt)}</span>
                  <span className="mini">Bác sĩ: {appointment.dentist?.fullName}</span>
                  {invoice && (
                    <div className="appointment-subpanel">
                      <strong>Hóa đơn: {formatMoney(invoice.total)}</strong>
                      <StatusBadge value={invoice.status} />
                    </div>
                  )}

                  {canModify ? (
                    <div className="patient-appointment-actions">
                      <button className="button small danger" onClick={() => cancelAppointment(appointment)}>
                        Hủy lịch
                      </button>
                      <div className="patient-reschedule-box">
                        <input
                          type="date"
                          min={todayInput()}
                          value={rescheduleForm.date}
                          onChange={(e) => updateRescheduleForm(appointment, { date: e.target.value })}
                        />
                        <select value={rescheduleForm.dentistId} onChange={(e) => updateRescheduleForm(appointment, { dentistId: e.target.value })}>
                          {dentistOptions.map((dentist) => (
                            <option key={dentist._id} value={dentist._id}>
                              {dentist.fullName}
                            </option>
                          ))}
                        </select>
                        <select value={rescheduleForm.time} onChange={(e) => updateRescheduleForm(appointment, { time: e.target.value })}>
                          {bookingSlotOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button className="button small" onClick={() => rescheduleAppointment(appointment)}>
                          Đổi lịch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="locked-note">Lịch này không thể thay đổi thêm.</span>
                  )}

                  {canReview && (
                    <form className="appointment-review-form" onSubmit={(event) => submitReview(event, appointment._id)}>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={reviewForm.rating}
                        onChange={(e) => updateReviewForm(appointment._id, { rating: e.target.value })}
                      />
                      <input
                        value={reviewForm.comment}
                        onChange={(e) => updateReviewForm(appointment._id, { comment: e.target.value })}
                        placeholder="Nhận xét"
                        maxLength={1000}
                      />
                      <button className="button small secondary">Gửi đánh giá</button>
                    </form>
                  )}
                </div>
                <StatusBadge value={appointment.status} />
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Chưa có lịch hẹn" text="Bạn có thể đặt lịch mới tại màn Đặt lịch." />
      )}
    </section>
  );
}
