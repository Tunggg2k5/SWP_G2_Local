import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney, todayInput } from "../../utils/format.js";
import { bookingSlotOptions } from "../../pages/BookingPage.jsx";
import RescheduleAppointmentModal from "./RescheduleAppointmentModal.jsx";
import ReviewForm from "./ReviewForm.jsx";

export default function PatientAppointmentCard({
  appointment,
  canModifyAppointment,
  cancelAppointment,
  dentistOptions,
  invoice,
  rescheduleAppointment,
  rescheduleForm,
  reviewForm,
  submitReview,
  updateRescheduleForm,
  updateReviewForm
}) {
  const canReview = appointment.status === "completed";
  const canModify = canModifyAppointment(appointment);
  const currentReviewForm = reviewForm || { rating: 5, comment: "" };
  const currentRescheduleForm = rescheduleForm || {
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
            <RescheduleAppointmentModal
              dentistOptions={dentistOptions}
              form={currentRescheduleForm}
              onChange={(next) => updateRescheduleForm(appointment, next)}
              onSubmit={() => rescheduleAppointment(appointment)}
            />
          </div>
        ) : (
          <span className="locked-note">Lịch này không thể thay đổi thêm.</span>
        )}

        {canReview && (
          <ReviewForm
            form={currentReviewForm}
            onChange={(next) => updateReviewForm(appointment._id, next)}
            onSubmit={(event) => submitReview(event, appointment._id)}
          />
        )}
      </div>
      <StatusBadge value={appointment.status} />
    </article>
  );
}
