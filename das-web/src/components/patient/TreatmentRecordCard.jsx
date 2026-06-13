export default function TreatmentRecordCard({ record }) {
  return (
    <div className="record-card" key={record._id}>
      <strong>{record.appointment?.service?.name}</strong>
      <p>{record.diagnosis || "Chưa có chẩn đoán"}</p>
      <span className="mini">{record.treatmentPlan || record.treatmentResult || "Chưa có kế hoạch điều trị"}</span>
    </div>
  );
}
