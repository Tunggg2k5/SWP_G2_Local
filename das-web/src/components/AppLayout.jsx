import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  ClipboardPenLine,
  ClipboardList,
  DoorOpen,
  Download,
  FileText,
  Home,
  Info,
  LockKeyhole,
  PhoneCall,
  Search,
  Settings2,
  ShieldCheck,
  Star,
  Stethoscope,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { canUsePublicLookup, isClinicalRole } from "../utils/roles.js";
import { firstError, validateName, validatePassword, validatePhone } from "../utils/validation.js";
import ChangePatientPassword from "./user/ChangePatientPassword.jsx";
import EditPatientProfile from "./user/EditPatientProfile.jsx";
import NotificationPanel from "./user/NotificationPanel.jsx";
import ProfileDropdown from "./user/ProfileDropdown.jsx";

const receptionistTabs = [
  { id: "appointments", label: "Lịch hẹn", icon: ClipboardList },
  { id: "checkin", label: "Check in", icon: ClipboardCheck },
  { id: "schedule", label: "Lịch khám", icon: CalendarDays },
  { id: "booking", label: "Đặt lịch hộ", icon: CalendarPlus },
  { id: "accounts", label: "Tài khoản", icon: LockKeyhole },
  { id: "consultations", label: "Tư vấn", icon: PhoneCall }
];

const adminTabs = [
  { id: "overview", label: "Thống kê", icon: BarChart3 },
  { id: "users", label: "Tài khoản", icon: UsersRound },
  { id: "services", label: "Dịch vụ", icon: Settings2 },
  { id: "rooms", label: "Phòng khám", icon: DoorOpen },
  { id: "workingHours", label: "Giờ làm", icon: CalendarDays },
  { id: "schedules", label: "Lịch nhân sự", icon: CalendarDays },
  { id: "reports", label: "Báo cáo", icon: Download },
  { id: "reviews", label: "Đánh giá", icon: Star }
];

const dentistTabs = [
  { id: "schedule", label: "Lịch khám", icon: Stethoscope },
  { id: "treatment", label: "Kế hoạch điều trị", icon: ClipboardPenLine },
  { id: "followUp", label: "Tái khám", icon: CalendarPlus },
  { id: "records", label: "Lịch sử điều trị", icon: FileText }
];

const nurseTabs = [
  { id: "schedule", label: "Lịch khám", icon: Stethoscope },
  { id: "treatment", label: "Cập nhật điều trị", icon: ClipboardPenLine },
  { id: "rooms", label: "Phòng khám", icon: DoorOpen },
  { id: "records", label: "Lịch sử điều trị", icon: FileText }
];

function navForRole(role) {
  if (role === "patient") {
    return [
      { id: "home", to: "/dashboard#home", hash: "#home", label: "Trang chủ", icon: Home, isPatientAnchor: true },
      { id: "services", to: "/dashboard#services", hash: "#services", label: "Dịch vụ", icon: Search, isPatientAnchor: true },
      { id: "about", to: "/dashboard#about", hash: "#about", label: "Giới thiệu", icon: Info, isPatientAnchor: true }
    ];
  }
  if (role === "receptionist") return receptionistTabs.map((item) => ({ ...item, to: `/dashboard?tab=${item.id}`, isTab: true }));
  if (role === "admin") return adminTabs.map((item) => ({ ...item, to: `/dashboard?tab=${item.id}`, isTab: true }));
  if (role === "dentist") return dentistTabs.map((item) => ({ ...item, to: `/dashboard?tab=${item.id}`, isTab: true }));
  if (role === "nurse") return nurseTabs.map((item) => ({ ...item, to: `/dashboard?tab=${item.id}`, isTab: true }));

  const base = [];
  if (canUsePublicLookup(role)) {
    base.push({ to: "/", label: "Tổng quan", icon: Search });
  }

  if (!role) return base;

  return [
    ...base,
    { to: "/dashboard", label: "Tổng quan", icon: ShieldCheck }
  ];
}

export default function AppLayout() {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = navForRole(user?.role);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "", gender: "unknown", address: "", bio: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [feedback, setFeedback] = useState({ message: "", error: "" });
  const fileInputRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPopoverRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountPopoverRef = useRef(null);

  const defaultTab = user?.role === "admin" ? "overview" : isClinicalRole(user?.role) ? "schedule" : "appointments";
  const activeTab = new URLSearchParams(location.search).get("tab") || defaultTab;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const userInitial = useMemo(() => user?.fullName?.trim()?.[0]?.toUpperCase() || "D", [user?.fullName]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      gender: user.gender || "unknown",
      address: user.address || "",
      bio: user.bio || ""
    });
    loadNotifications();
  }, [user?._id, user?.fullName, user?.phone, user?.gender, user?.address, user?.bio]);

  useEffect(() => {
    setShowNotifications(false);
    setShowAccountMenu(false);
    setProfileOpen(false);
    setPasswordOpen(false);
  }, [user?._id, location.pathname]);

  useEffect(() => {
    function closeFloatingMenus(event) {
      const target = event.target;
      if (
        showNotifications &&
        !notificationPopoverRef.current?.contains(target) &&
        !notificationButtonRef.current?.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (
        showAccountMenu &&
        !accountPopoverRef.current?.contains(target) &&
        !accountButtonRef.current?.contains(target)
      ) {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener("mousedown", closeFloatingMenus);
    return () => document.removeEventListener("mousedown", closeFloatingMenus);
  }, [showAccountMenu, showNotifications]);

  if (location.pathname === "/" || location.pathname === "/dat-lich-hen") {
    return <Outlet />;
  }

  async function loadNotifications() {
    try {
      const res = await api.get("/auth/notifications");
      setNotifications(res.data.notifications || []);
    } catch (_error) {
      setNotifications([]);
    }
  }

  function clearFeedback() {
    setFeedback({ message: "", error: "" });
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function saveProfile(event) {
    event.preventDefault();
    const validationError = firstError(validateName(profileForm.fullName), validatePhone(profileForm.phone));
    if (validationError) {
      setFeedback({ message: "", error: validationError });
      return;
    }

    try {
      const res = await api.patch("/auth/me", profileForm);
      updateUser(res.data.user);
      setProfileOpen(false);
      setShowAccountMenu(false);
      setFeedback({ message: "Đã cập nhật thông tin cá nhân.", error: "" });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const validationError = firstError(
      passwordForm.currentPassword ? "" : "Mật khẩu hiện tại là bắt buộc.",
      validatePassword(passwordForm.newPassword)
    );
    if (validationError) {
      setFeedback({ message: "", error: validationError });
      return;
    }

    try {
      await api.patch("/auth/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordOpen(false);
      setShowAccountMenu(false);
      setFeedback({ message: "Đã đổi mật khẩu.", error: "" });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const avatarUrl = await fileToCompressedAvatar(file);
      const res = await api.patch("/auth/me", { avatarUrl });
      updateUser(res.data.user);
      setShowAccountMenu(false);
      setFeedback({ message: "Đã cập nhật avatar.", error: "" });
    } catch (error) {
      setFeedback({ message: "", error: error.message || getErrorMessage(error) });
    }
  }

  async function markNotificationRead(notification) {
    if (!notification?._id || notification.isRead) return;
    try {
      await api.patch(`/auth/notifications/${notification._id}/read`);
      await loadNotifications();
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function markAllNotificationsRead() {
    if (!unreadCount) return;
    const previousNotifications = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    try {
      await api.patch("/auth/notifications/read-all");
    } catch (error) {
      setNotifications(previousNotifications);
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  return (
    <div className={`app-shell top-nav-shell role-shell role-${user?.role || "guest"}`}>
      <Feedback error={feedback.error} message={feedback.message} onClear={clearFeedback} />
      <header className="app-topnav">
        <Link className="top-brand" to={user?.role === "patient" ? "/dashboard#home" : "/"}>
          <DoorOpen size={24} />
          <span>{user?.role === "patient" ? "SmileCare" : "Phòng khám DAS"}</span>
        </Link>

        <nav className="top-nav-list" aria-label="Điều hướng chính">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.isTab
              ? activeTab === item.id && location.pathname === "/dashboard"
              : item.isPatientAnchor && location.pathname === "/dashboard" && (location.hash || "#home") === item.hash;
            return item.isTab || item.isPatientAnchor ? (
              <Link key={item.id} to={item.to} className={`top-nav-item ${active ? "active" : ""}`}>
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `top-nav-item ${isActive ? "active" : ""}`}>
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="top-user-box">
          {user ? (
            <>
              <button
                className="top-notification-button"
                onClick={() => {
                  setShowNotifications((value) => {
                    if (!value) markAllNotificationsRead();
                    return !value;
                  });
                  setShowAccountMenu(false);
                }}
                ref={notificationButtonRef}
                title="Thông báo"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </button>
              <button
                className="top-avatar-button"
                onClick={() => {
                  setShowAccountMenu((value) => !value);
                  setShowNotifications(false);
                }}
                ref={accountButtonRef}
                title="Tài khoản"
              >
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || "Avatar"} /> : <span>{userInitial}</span>}
              </button>
            </>
          ) : null}
        </div>

        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={markNotificationRead}
            popoverRef={notificationPopoverRef}
            userInitial={userInitial}
          />
        )}

        {showAccountMenu && user && (
          <ProfileDropdown
            accountPopoverRef={accountPopoverRef}
            fileInputRef={fileInputRef}
            onChangePassword={() => { setPasswordOpen(true); setShowAccountMenu(false); }}
            onEditProfile={() => { setProfileOpen(true); setShowAccountMenu(false); }}
            onLogout={handleLogout}
            onUploadAvatar={uploadAvatar}
            user={user}
            userInitial={userInitial}
          />
        )}
      </header>

      <main className="content top-nav-content">
        <Outlet />
      </main>

      {profileOpen && (
        <EditPatientProfile
          form={profileForm}
          onCancel={() => setProfileOpen(false)}
          onChange={setProfileForm}
          onSubmit={saveProfile}
        />
      )}

      {passwordOpen && (
        <ChangePatientPassword
          form={passwordForm}
          onCancel={() => setPasswordOpen(false)}
          onChange={setPasswordForm}
          onSubmit={changePassword}
        />
      )}
    </div>
  );
}

function fileToCompressedAvatar(file) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Chỉ hỗ trợ file ảnh."));
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSize = 360;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không đọc được file ảnh."));
    };
    image.src = objectUrl;
  });
}
