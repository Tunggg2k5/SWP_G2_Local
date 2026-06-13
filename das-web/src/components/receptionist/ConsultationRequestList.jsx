import { PhoneCall } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function ConsultationRequestList({ consultations, loading, onUpdateConsultation }) {
  return (
    <section className="panel">
      <div className="section-title">
        <PhoneCall size={20} />
        <h2>Yêu cầu tư vấn</h2>
      </div>
      <div className="mini-list">
        {loading ? (
          <EmptyState title="Đang tải yêu cầu tư vấn" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : consultations.map((item) => (
          <div className="mini-row" key={item._id}>
            <span>
              {item.fullName} - {item.phone}
            </span>
            <StatusBadge value={item.status} />
            <button className="button small" onClick={() => onUpdateConsultation(item._id, "contacted")}>
              Đã gọi
            </button>
            <button className="button small" onClick={() => onUpdateConsultation(item._id, "closed")}>
              Đóng
            </button>
          </div>
        ))}
        {!loading && !consultations.length && <EmptyState />}
      </div>
    </section>
  );
}
