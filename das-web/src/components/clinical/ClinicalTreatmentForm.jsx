import { ClipboardPenLine } from "lucide-react";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";

export default function ClinicalTreatmentForm({
  appointments,
  form,
  onChange,
  onSubmit,
  selectedAppointment,
  user
}) {
  const isNurse = user?.role === "nurse";

  return (
    <section className="panel clinical-treatment-panel">
      <div className="section-title">
        <ClipboardPenLine size={20} />
        <h2>{user?.role === "dentist" ? "Quản lý kế hoạch điều trị" : "Cập nhật điều trị"}</h2>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Lịch khám</span>
          <select value={form.appointmentId} onChange={(event) => onChange("appointmentId", event.target.value)}>
            <option value="">Chọn lịch khám</option>
            {appointments.map((appointment) => (
              <option key={appointment._id} value={appointment._id}>
                {appointment.patient?.fullName || "Bệnh nhân"} - {appointment.service?.name || "Dịch vụ"} - {formatDateTime(appointment.startAt)}
              </option>
            ))}
          </select>
        </label>

        {selectedAppointment && (
          <div className="clinical-selected-card">
            <strong>{selectedAppointment.patient?.fullName}</strong>
            <span>{selectedAppointment.service?.name} / {selectedAppointment.room?.name}</span>
            <StatusBadge value={selectedAppointment.status} />
          </div>
        )}

        {isNurse ? (
          <div className="form-grid">
            <label className="field">
              <span>Huyết áp</span>
              <input value={form.bloodPressure} onChange={(event) => onChange("bloodPressure", event.target.value)} />
            </label>
            <label className="field">
              <span>Nhịp tim</span>
              <input value={form.heartRate} onChange={(event) => onChange("heartRate", event.target.value)} />
            </label>
            <label className="field">
              <span>SpO2</span>
              <input value={form.spo2} onChange={(event) => onChange("spo2", event.target.value)} />
            </label>
            <label className="field">
              <span>Nhiệt độ</span>
              <input value={form.temperature} onChange={(event) => onChange("temperature", event.target.value)} />
            </label>
            <label className="field">
              <span>Nhịp thở</span>
              <input value={form.respiratoryRate} onChange={(event) => onChange("respiratoryRate", event.target.value)} />
            </label>
            <label className="field wide">
              <span>Ghi chú hỗ trợ chẩn đoán</span>
              <textarea value={form.treatmentNote} onChange={(event) => onChange("treatmentNote", event.target.value)} rows="3" />
            </label>
          </div>
        ) : (
          <>
            <label className="field">
              <span>Chẩn đoán</span>
              <textarea value={form.diagnosis} onChange={(event) => onChange("diagnosis", event.target.value)} rows="3" />
            </label>
            <label className="field">
              <span>Kế hoạch điều trị</span>
              <textarea value={form.treatmentPlan} onChange={(event) => onChange("treatmentPlan", event.target.value)} rows="3" />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Chi phí dự kiến</span>
                <input type="number" min="0" value={form.estimatedCost} onChange={(event) => onChange("estimatedCost", event.target.value)} />
              </label>
              <label className="field">
                <span>Kết quả điều trị</span>
                <input value={form.treatmentResult} onChange={(event) => onChange("treatmentResult", event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Ghi chú điều trị</span>
              <textarea value={form.treatmentNote} onChange={(event) => onChange("treatmentNote", event.target.value)} rows="3" />
            </label>
          </>
        )}
        <div className="row-actions clinical-treatment-actions">
          <button className="button primary">{isNurse ? "Lưu thông tin chung" : "Lưu điều trị"}</button>
        </div>
      </form>
    </section>
  );
}
