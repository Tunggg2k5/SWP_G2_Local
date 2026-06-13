import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";

export default function InvoiceCard({ invoice }) {
  return (
    <div className="record-card" key={invoice._id}>
      <strong>{invoice.appointment?.service?.name || "Hóa đơn dịch vụ"}</strong>
      <p>{formatMoney(invoice.total || invoice.totalAmount || 0)}</p>
      <span className="mini">Ngày tạo: {formatDateTime(invoice.invoiceDate || invoice.createdAt)}</span>
      <span className="mini">Lịch hẹn: {formatDateTime(invoice.appointment?.startAt)}</span>
      <StatusBadge value={invoice.status} />
    </div>
  );
}
