import { CalendarClock } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import PatientAppointmentCard from "./PatientAppointmentCard.jsx";

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
          {appointments.map((appointment) => (
            <PatientAppointmentCard
              appointment={appointment}
              canModifyAppointment={canModifyAppointment}
              cancelAppointment={cancelAppointment}
              dentistOptions={dentistOptions}
              invoice={invoiceByAppointment.get(appointment._id)}
              key={appointment._id}
              rescheduleAppointment={rescheduleAppointment}
              rescheduleForm={rescheduleForms[appointment._id]}
              reviewForm={reviewForms[appointment._id]}
              submitReview={submitReview}
              updateRescheduleForm={updateRescheduleForm}
              updateReviewForm={updateReviewForm}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có lịch hẹn" text="Bạn có thể đặt lịch mới tại màn Đặt lịch." />
      )}
    </section>
  );
}
