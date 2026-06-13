import { todayInput } from "../../utils/format.js";
import { bookingSlotOptions } from "../../pages/BookingPage.jsx";

export default function RescheduleAppointmentModal({
  dentistOptions,
  form,
  onChange,
  onSubmit
}) {
  return (
    <div className="patient-reschedule-box">
      <input
        type="date"
        min={todayInput()}
        value={form.date}
        onChange={(event) => onChange({ date: event.target.value })}
      />
      <select value={form.dentistId} onChange={(event) => onChange({ dentistId: event.target.value })}>
        {dentistOptions.map((dentist) => (
          <option key={dentist._id} value={dentist._id}>
            {dentist.fullName}
          </option>
        ))}
      </select>
      <select value={form.time} onChange={(event) => onChange({ time: event.target.value })}>
        {bookingSlotOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button className="button small" onClick={onSubmit}>
        Đổi lịch
      </button>
    </div>
  );
}
