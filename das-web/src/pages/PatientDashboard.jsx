import { CalendarClock, CalendarPlus, FileText, Home, Menu, ReceiptText, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import PatientAppointmentList from "../components/patient/PatientAppointmentList.jsx";
import PatientInvoiceList from "../components/patient/PatientInvoiceList.jsx";
import PatientTreatmentPlans from "../components/patient/PatientTreatmentPlans.jsx";
import PatientTreatmentRecords from "../components/patient/PatientTreatmentRecords.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { formatDateTime, formatMoney, todayInput } from "../utils/format.js";
import { usePublicBootstrap } from "../utils/usePublicBootstrap.js";
import BookingPage, { bookingSlotOptions, toClinicIso } from "./BookingPage.jsx";

const patientNav = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "booking", label: "Đặt lịch", icon: CalendarPlus },
  { id: "appointments", label: "Lịch hẹn", icon: CalendarClock },
  { id: "plans", label: "Kế hoạch", icon: FileText },
  { id: "invoices", label: "Hóa đơn", icon: ReceiptText },
  { id: "records", label: "Hồ sơ điều trị", icon: FileText }
];

const lockedPatientStatuses = new Set(["cancelled", "rejected", "completed", "no_show"]);

export default function PatientDashboard() {
  const location = useLocation();
  const [activeFeature, setActiveFeature] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForms, setReviewForms] = useState({});
  const [rescheduleForms, setRescheduleForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { services, dentists, rooms } = usePublicBootstrap();

  const dentistOptions = useMemo(() => {
    const roomDentists = rooms.map((room) => room.assignedDentist).filter(Boolean);
    return Array.from(new Map([...roomDentists, ...dentists].map((dentist) => [dentist._id, dentist])).values());
  }, [dentists, rooms]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/patient/dashboard");
      setAppointments(res.data.appointments || []);
      setRecords(res.data.records || []);
      setTreatmentPlans(res.data.treatmentPlans || []);
      setInvoices(res.data.invoices || []);
      setNotifications(res.data.notifications || []);
      setReviews(res.data.reviews || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const hash = location.hash || "#home";
    if (["#home", "#services", "#about"].includes(hash)) {
      setActiveFeature("home");
      window.requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  function updateReviewForm(appointmentId, values) {
    setReviewForms((current) => ({
      ...current,
      [appointmentId]: {
        rating: 5,
        comment: "",
        ...(current[appointmentId] || {}),
        ...values
      }
    }));
  }

  function updateRescheduleForm(appointment, values) {
    setRescheduleForms((current) => ({
      ...current,
      [appointment._id]: {
        date: todayInput(),
        time: bookingSlotOptions[0].value,
        dentistId: appointment.dentist?._id || dentistOptions[0]?._id || "",
        ...(current[appointment._id] || {}),
        ...values
      }
    }));
  }

  async function submitReview(event, appointmentId) {
    event.preventDefault();
    const review = reviewForms[appointmentId] || { rating: 5, comment: "" };
    if (!window.confirm("Xác nhận gửi đánh giá cho lịch hẹn này?")) return;

    try {
      await api.post("/patient/reviews", { ...review, appointmentId });
      setReviewForms((current) => ({ ...current, [appointmentId]: { rating: 5, comment: "" } }));
      setMessage("Đã gửi đánh giá.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function cancelAppointment(appointment) {
    if (!canModifyAppointment(appointment)) {
      setError("Lịch hẹn này không thể thay đổi thêm.");
      return;
    }
    if (!window.confirm("Xác nhận hủy lịch hẹn này?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/cancel`, { reason: "Bệnh nhân hủy lịch hẹn." });
      setMessage("Đã hủy lịch hẹn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function rescheduleAppointment(appointment) {
    if (!canModifyAppointment(appointment)) {
      setError("Lịch hẹn này không thể đổi lịch.");
      return;
    }

    const form = rescheduleForms[appointment._id] || {};
    if (!form.date || !form.time || !form.dentistId) {
      setError("Chọn ngày, giờ và bác sĩ trước khi đổi lịch.");
      return;
    }

    const room = rooms.find((item) => item.assignedDentist?._id === form.dentistId) || rooms.find((item) => item.assignedDentist);
    if (!room) {
      setError("Chưa có phòng khám được gán bác sĩ. Vui lòng liên hệ lễ tân.");
      return;
    }

    const slot = bookingSlotOptions.find((option) => option.value === form.time);
    if (!window.confirm(`Xác nhận đổi lịch sang ${form.date}, ca ${slot?.label || form.time}?`)) return;

    try {
      await api.patch(`/appointments/${appointment._id}/reschedule`, {
        serviceId: appointment.service?._id,
        date: form.date,
        startAt: toClinicIso(form.date, form.time),
        roomId: room._id
      });
      setMessage("Đã đổi lịch hẹn.");
      setRescheduleForms((current) => ({ ...current, [appointment._id]: undefined }));
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const activeAppointments = appointments
    .filter((item) => !["cancelled", "completed", "no_show", "rejected"].includes(item.status) && new Date(item.startAt) >= new Date())
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const nextAppointment = activeAppointments[0];
  const unreadNotifications = notifications.filter((item) => item.type === "notification" && !item.isRead);
  const invoiceByAppointment = new Map(invoices.filter((invoice) => invoice.appointment?._id).map((invoice) => [invoice.appointment._id, invoice]));

  return (
    <div className={`patient-dashboard-shell ${sidebarOpen ? "" : "collapsed"}`}>
      <Feedback error={error} message={message} onClear={() => { setError(""); setMessage(""); }} />

      <main className="patient-dashboard-content">
        {activeFeature === "home" && (
          <PatientHome
            activeAppointments={activeAppointments}
            dentistOptions={dentistOptions}
            nextAppointment={nextAppointment}
            notifications={unreadNotifications}
            records={records}
            treatmentPlans={treatmentPlans}
            reviews={reviews}
            services={services}
            setActiveFeature={setActiveFeature}
          />
        )}

        {activeFeature === "booking" && <BookingPage embedded />}

        {activeFeature === "appointments" && (
          <PatientAppointmentList
            appointments={appointments}
            canModifyAppointment={canModifyAppointment}
            cancelAppointment={cancelAppointment}
            dentistOptions={dentistOptions}
            invoiceByAppointment={invoiceByAppointment}
            loading={loading}
            rescheduleAppointment={rescheduleAppointment}
            rescheduleForms={rescheduleForms}
            reviewForms={reviewForms}
            submitReview={submitReview}
            updateRescheduleForm={updateRescheduleForm}
            updateReviewForm={updateReviewForm}
          />
        )}

        {activeFeature === "plans" && <PatientTreatmentPlans loading={loading} treatmentPlans={treatmentPlans} />}

        {activeFeature === "invoices" && <PatientInvoiceList invoices={invoices} loading={loading} />}

        {activeFeature === "records" && <PatientTreatmentRecords loading={loading} records={records} />}
      </main>

      {sidebarOpen ? (
        <aside className="patient-sidebar">
          <div className="patient-sidebar-tools">
            <strong>SmileCare</strong>
            <button className="icon-button" onClick={() => setSidebarOpen(false)} title="Đóng menu">
              <X size={18} />
            </button>
          </div>

          <nav className="patient-side-nav">
            {patientNav.map((item) => {
              const Icon = item.icon;
              return (
                <button className={activeFeature === item.id ? "active" : ""} key={item.id} onClick={() => setActiveFeature(item.id)}>
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      ) : (
        <button className="patient-sidebar-fab" onClick={() => setSidebarOpen(true)} title="Mở menu">
          <Menu size={22} />
        </button>
      )}
    </div>
  );
}

function PatientHome({ activeAppointments, dentistOptions, nextAppointment, notifications, records, treatmentPlans, reviews, services, setActiveFeature }) {
  const visibleServices = services.length ? services.slice(0, 5) : [
    { _id: "fallback-service-1", name: "Khám tổng quát", description: "Kiểm tra răng miệng định kỳ và tư vấn kế hoạch điều trị.", price: 0 },
    { _id: "fallback-service-2", name: "Trám răng", description: "Phục hồi răng sâu, mẻ bằng vật liệu nha khoa an toàn.", price: 350000 },
    { _id: "fallback-service-3", name: "Tẩy trắng răng", description: "Cải thiện màu răng với quy trình chuyên nghiệp tại phòng khám.", price: 1200000 }
  ];
  const recentReviews = reviews.slice(0, 4);

  return (
    <>
      <section className="patient-dark-hero" id="home">
        <div>
          <span className="patient-hero-pill">Xin chào</span>
          <h1>Chăm sóc lịch khám và hồ sơ nha khoa của bạn</h1>
          <p>Theo dõi lịch hẹn, kế hoạch điều trị, hóa đơn và đánh giá dịch vụ SmileCare trong cùng một màn hình.</p>
          <div className="patient-hero-actions">
            <button className="button primary" onClick={() => setActiveFeature("booking")}>Đặt lịch mới</button>
            <button className="button ghost" onClick={() => setActiveFeature("appointments")}>Xem lịch hẹn</button>
          </div>
        </div>
        <aside className="patient-hero-summary">
          <span>Lịch sắp tới <strong>{activeAppointments.length}</strong></span>
          <span>Kế hoạch <strong>{treatmentPlans.length}</strong></span>
          <span>Thông báo <strong>{notifications.length}</strong></span>
        </aside>
      </section>

      {nextAppointment && (
        <section className="patient-next-card">
          <div>
            <span className="patient-hero-pill">Lịch gần nhất</span>
            <strong>{nextAppointment.service?.name}</strong>
            <p>{formatDateTime(nextAppointment.startAt)} - {nextAppointment.room?.name || "Phòng khám"}</p>
            <small>Bác sĩ: {nextAppointment.dentist?.fullName}</small>
          </div>
          <button className="button small" onClick={() => setActiveFeature("appointments")}>Chi tiết</button>
        </section>
      )}

      <section className="patient-dark-section" id="services">
        <div className="patient-section-heading">
          <span>Dịch vụ</span>
          <h2>Những dịch vụ bạn có thể đặt lịch</h2>
        </div>
        <div className="patient-dark-service-grid">
          {visibleServices.map((service, index) => (
            <article className={`patient-dark-service-card service-tone-${index % 5}`} key={service._id}>
              <span className="patient-service-badge">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{service.name}</h3>
                <p>{service.description || "Dịch vụ chăm sóc răng miệng tại phòng khám."}</p>
              </div>
              {service.price ? <strong>{formatMoney(service.price)}</strong> : <strong>Liên hệ tư vấn</strong>}
            </article>
          ))}
        </div>
      </section>

      <section className="patient-dark-section patient-about-section" id="about">
        <div className="patient-section-heading">
          <span>Giới thiệu</span>
          <h2>SmileCare đồng bộ lịch hẹn, bác sĩ và phòng điều trị</h2>
        </div>
        <div className="patient-about-grid">
          <article>
            <strong>{dentistOptions.length || 3}</strong>
            <p>{dentistOptions.length || 3} bác sĩ phụ trách khám, tư vấn và theo dõi điều trị.</p>
          </article>
          <article>
            <strong>{records.length}</strong>
            <p>Hồ sơ điều trị đã ghi nhận cho tài khoản của bạn.</p>
          </article>
          <article>
            <strong>{activeAppointments.length}</strong>
            <p>Lịch khám đang chờ xử lý hoặc đã xác nhận trong thời gian tới.</p>
          </article>
        </div>
      </section>

      {recentReviews.length ? (
        <section className="patient-dark-section">
          <div className="patient-section-heading">
            <span>Đánh giá gần đây</span>
            <h2>Trải nghiệm từ bệnh nhân SmileCare</h2>
          </div>
          <div className="patient-dark-review-grid">
            {recentReviews.map((review) => (
              <article className="patient-dark-review-card" key={review._id}>
                <div className="review-stars" aria-label={`${review.rating || review.ratingService || 5} sao`}>
                  {Array.from({ length: Number(review.rating || review.ratingService || 5) }, (_, index) => <Star fill="currentColor" size={15} key={index} />)}
                </div>
                <p>{review.comment || "Chưa có nhận xét chi tiết."}</p>
                <div>
                  <strong>{review.service?.name || "Dịch vụ"}</strong>
                  <span>{review.dentist?.fullName || "Bác sĩ phòng khám"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function canModifyAppointment(appointment) {
  return !lockedPatientStatuses.has(appointment.status) && new Date(appointment.startAt) > new Date();
}
