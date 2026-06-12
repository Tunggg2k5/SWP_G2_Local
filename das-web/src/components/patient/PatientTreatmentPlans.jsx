import { FileText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatMoney } from "../../utils/format.js";

export default function PatientTreatmentPlans({ loading, treatmentPlans }) {
  return (
    <section className="panel" id="plans">
      <div className="section-title">
        <FileText size={20} />
        <h2>Kế hoạch điều trị</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải kế hoạch" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : treatmentPlans.length ? (
        <div className="mini-list">
          {treatmentPlans.map((plan) => (
            <div className="record-card" key={plan._id}>
              <strong>{plan.treatmentRecord?.appointment?.service?.name || "Kế hoạch điều trị"}</strong>
              <p>{plan.planDetail || plan.treatmentRecord?.treatmentPlan || "Chưa có mô tả kế hoạch."}</p>
              <span className="mini">Bác sĩ: {plan.dentist?.fullName || plan.treatmentRecord?.dentist?.fullName || "-"}</span>
              <span className="mini">Chi phí dự kiến: {formatMoney(plan.estimatedCost || 0)}</span>
              <StatusBadge value={plan.status} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có kế hoạch" text="Kế hoạch điều trị sẽ hiển thị sau khi bác sĩ tạo hồ sơ." />
      )}
    </section>
  );
}
