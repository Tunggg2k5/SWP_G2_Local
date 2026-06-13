import { Settings2 } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatMoney } from "../../utils/format.js";

export default function DentalServiceManagement({
  loading,
  onCreateService,
  onServiceFormChange,
  onUpdateServiceActive,
  serviceForm,
  services
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Thêm dịch vụ nha khoa</h2>
        </div>
        <form className="stack" onSubmit={onCreateService}>
          <label className="field">
            <span>Tên dịch vụ</span>
            <input value={serviceForm.name} onChange={(event) => onServiceFormChange({ name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Mô tả</span>
            <textarea value={serviceForm.description} onChange={(event) => onServiceFormChange({ description: event.target.value })} rows="3" />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Thời lượng</span>
              <input
                type="number"
                min="10"
                value={serviceForm.durationMinutes}
                onChange={(event) => onServiceFormChange({ durationMinutes: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Giá</span>
              <input type="number" min="0" value={serviceForm.price} onChange={(event) => onServiceFormChange({ price: event.target.value })} />
            </label>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={serviceForm.requiresPrepayment}
              onChange={(event) => onServiceFormChange({ requiresPrepayment: event.target.checked })}
            />
            <span>Thanh toán khi bệnh nhân đến khám</span>
          </label>
          <button className="button primary">Thêm dịch vụ</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Dịch vụ</h2>
        </div>
        {loading ? (
          <EmptyState title="Đang tải dịch vụ" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : (
          <div className="mini-list">
            {services.map((service) => (
              <div className="mini-row" key={service._id}>
                <span>{service.name}</span>
                <span>{service.durationMinutes} phút</span>
                <span>{formatMoney(service.price)}</span>
                <StatusBadge value={service.isActive ? "active" : "inactive"} />
                <button
                  className={`button small ${service.isActive ? "danger" : "secondary"}`}
                  type="button"
                  onClick={() => onUpdateServiceActive(service, !service.isActive)}
                >
                  {service.isActive ? "Ẩn" : "Khôi phục"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
