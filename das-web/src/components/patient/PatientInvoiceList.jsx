import { ReceiptText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";

export default function PatientInvoiceList({ invoices, loading }) {
  return (
    <section className="panel" id="invoices">
      <div className="section-title">
        <ReceiptText size={20} />
        <h2>Hóa đơn của tôi</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải hóa đơn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : invoices.length ? (
        <div className="mini-list">
          {invoices.map((invoice) => (
            <div className="record-card" key={invoice._id}>
              <strong>{invoice.appointment?.service?.name || "Hóa đơn dịch vụ"}</strong>
              <p>{formatMoney(invoice.total || invoice.totalAmount || 0)}</p>
              <span className="mini">Ngày tạo: {formatDateTime(invoice.invoiceDate || invoice.createdAt)}</span>
              <span className="mini">Lịch hẹn: {formatDateTime(invoice.appointment?.startAt)}</span>
              <StatusBadge value={invoice.status} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có hóa đơn" text="Hóa đơn sẽ xuất hiện sau khi lịch khám được tiếp nhận." />
      )}
    </section>
  );
}
