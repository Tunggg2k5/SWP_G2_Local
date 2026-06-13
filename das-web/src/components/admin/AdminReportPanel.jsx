import { BarChart3, Download, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import { formatDateTime, formatMoney } from "../../utils/format.js";
import AdminMetric from "./AdminMetric.jsx";

function summarizeInvoices(items = []) {
  if (!items.length) return "Chưa có hóa đơn";
  return items.map((item) => `${item._id}: ${formatMoney(item.total || 0)} (${item.count})`).join(", ");
}

export default function AdminReportPanel({
  onExportReport,
  onLoadPatientStatistics,
  onLoadRevenueReport,
  onReportFiltersChange,
  patientStatistics,
  report,
  reportFilters,
  revenueReport,
  stats
}) {
  return (
    <>
      <section className="metrics-grid">
        <AdminMetric icon={BarChart3} label="Doanh thu đã thu" value={formatMoney(stats?.revenue || 0)} />
        <AdminMetric icon={UsersRound} label="Bệnh nhân" value={stats?.patientCount || 0} />
        <AdminMetric icon={ShieldCheck} label="Vắng mặt" value={stats?.noShowCount || 0} />
        <AdminMetric icon={Settings2} label="Đánh giá TB" value={Number(stats?.review?.average || 0).toFixed(1)} />
      </section>

      <section className="panel">
        <div className="section-title">
          <BarChart3 size={20} />
          <h2>Bộ lọc báo cáo</h2>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Từ ngày</span>
            <input type="date" value={reportFilters.startDate} onChange={(event) => onReportFiltersChange({ startDate: event.target.value })} />
          </label>
          <label className="field">
            <span>Đến ngày</span>
            <input type="date" value={reportFilters.endDate} onChange={(event) => onReportFiltersChange({ endDate: event.target.value })} />
          </label>
          <button className="button primary" type="button" onClick={onLoadRevenueReport}>
            Xem doanh thu
          </button>
          <button className="button secondary" type="button" onClick={onLoadPatientStatistics}>
            Xem bệnh nhân
          </button>
        </div>
      </section>

      {(revenueReport || patientStatistics) && (
        <section className="panel">
          <div className="section-title">
            <Download size={20} />
            <h2>Kết quả báo cáo</h2>
          </div>
          <div className="metrics-grid compact-grid">
            {revenueReport?.summary?.map((item) => (
              <AdminMetric icon={BarChart3} label={`Hóa đơn ${item._id}`} value={`${formatMoney(item.total || 0)} / ${item.count}`} key={item._id} />
            ))}
            {patientStatistics && (
              <>
                <AdminMetric icon={UsersRound} label="Bệnh nhân mới" value={patientStatistics.newPatients || 0} />
                <AdminMetric icon={UsersRound} label="Bệnh nhân quay lại" value={patientStatistics.returningPatients || 0} />
              </>
            )}
          </div>
          {patientStatistics?.serviceUsage?.length ? (
            <div className="mini-list">
              {patientStatistics.serviceUsage.map((item) => (
                <div className="mini-row" key={item._id || item.serviceName}>
                  <span>{item.serviceName || "Dịch vụ"}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      <section className="panel">
        <div className="section-title">
          <Download size={20} />
          <h2>Xuất báo cáo</h2>
        </div>
        <div className="stack">
          <p className="muted">Báo cáo gồm doanh thu, thống kê bệnh nhân, đánh giá, vắng mặt và tổng lịch hẹn.</p>
          <button className="button primary" onClick={onExportReport}>
            <Download size={18} />
            Tải báo cáo JSON
          </button>
          {report && (
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th>Thời điểm</th>
                    <td>{formatDateTime(report.generatedAt)}</td>
                  </tr>
                  <tr>
                    <th>Tổng lịch hẹn</th>
                    <td>{report.appointments}</td>
                  </tr>
                  <tr>
                    <th>Vắng mặt</th>
                    <td>{report.noShowCount}</td>
                  </tr>
                  <tr>
                    <th>Đánh giá</th>
                    <td>
                      {Number(report.reviewSummary?.average || 0).toFixed(1)} ({report.reviewSummary?.count || 0} lượt)
                    </td>
                  </tr>
                  <tr>
                    <th>Hóa đơn</th>
                    <td>{summarizeInvoices(report.invoiceSummary)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
