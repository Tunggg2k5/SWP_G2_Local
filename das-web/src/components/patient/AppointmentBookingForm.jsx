import { CalendarSearch, Clock, Stethoscope } from "lucide-react";
import { formatMoney } from "../../utils/format.js";
import { bookingSlotOptions } from "../../pages/BookingPage.jsx";

export default function AppointmentBookingForm({
  bootstrapLoading,
  date,
  dentistId,
  dentistOptions,
  embedded,
  minDate,
  note,
  onChange,
  onSubmit,
  selectedService,
  serviceId,
  services,
  submitting,
  time,
  user
}) {
  return (
    <section className="panel patient-booking-panel">
      <div className="booking-form-heading">
        <CalendarSearch size={24} />
        <div>
          <h2>Đặt lịch khám</h2>
          <p>Miễn phí chụp phim, tư vấn và thăm khám khi khách hàng đặt lịch hẹn trước.</p>
        </div>
      </div>

      <form className="booking-form-modern" onSubmit={onSubmit}>
        <label className="field">
          <span>Họ và tên</span>
          <input value={user?.fullName || ""} disabled />
        </label>

        <label className="field">
          <span>Số điện thoại</span>
          <input value={user?.phone || ""} disabled />
        </label>

        <label className="field">
          <span>Dịch vụ quan tâm</span>
          <select value={serviceId} onChange={(event) => onChange({ serviceId: event.target.value })} disabled={bootstrapLoading} required>
            {services.map((service) => (
              <option value={service._id} key={service._id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Bác sĩ</span>
          <select value={dentistId} onChange={(event) => onChange({ dentistId: event.target.value })} disabled={bootstrapLoading} required>
            <option value="random">Bác sĩ ngẫu nhiên</option>
            {dentistOptions.map((dentist) => (
              <option value={dentist._id} key={dentist._id}>
                {dentist.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ngày khám</span>
          <input type="date" value={date} min={minDate} onChange={(event) => onChange({ date: event.target.value })} required />
        </label>

        <fieldset className="booking-time-field">
          <legend>Giờ khám</legend>
          <div className="booking-time-options">
            {bookingSlotOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name={`booking-time${embedded ? "-embedded" : ""}`}
                  value={option.value}
                  checked={time === option.value}
                  onChange={(event) => onChange({ time: event.target.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field wide">
          <span>Ghi chú</span>
          <input
            value={note}
            onChange={(event) => onChange({ note: event.target.value })}
            placeholder="Triệu chứng hoặc yêu cầu thêm"
            maxLength={1000}
          />
        </label>

        {selectedService && (
          <div className="booking-summary-strip">
            <span>
              <Stethoscope size={16} />
              {selectedService.name}
            </span>
            <span>
              <Clock size={16} />
              {selectedService.requiresPrepayment ? `Thanh toán khi đến khám: ${formatMoney(selectedService.price)}` : "Chi phí xác định sau khám"}
            </span>
          </div>
        )}

        <button className="button primary booking-submit-final" disabled={submitting || bootstrapLoading}>
          {submitting ? "Đang gửi..." : "Đặt lịch"}
        </button>
      </form>
    </section>
  );
}
