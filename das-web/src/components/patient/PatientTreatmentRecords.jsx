import { FileText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";

export default function PatientTreatmentRecords({ loading, records }) {
  return (
    <section className="panel" id="records">
      <div className="section-title">
        <FileText size={20} />
        <h2>Hồ sơ điều trị</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải hồ sơ" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : records.length ? (
        <div className="mini-list">
          {records.map((record) => (
            <div className="record-card" key={record._id}>
              <strong>{record.appointment?.service?.name}</strong>
              <p>{record.diagnosis || "Chưa có chẩn đoán"}</p>
              <span className="mini">{record.treatmentPlan || record.treatmentResult || "Chưa có kế hoạch điều trị"}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
