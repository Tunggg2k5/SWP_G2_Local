import { KeyRound, LockKeyhole, Phone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../../utils/api.js";
import { firstError, validatePassword, validatePhone } from "../../utils/validation.js";

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    phone: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestCode(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validatePhone(form.phone);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { phone: form.phone });
      setRequested(true);
      setForm((current) => ({ ...current, verificationCode: res.data.verificationCode || current.verificationCode }));
      setMessage(res.data.verificationCode ? `${res.data.message} Mã demo: ${res.data.verificationCode}` : res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = firstError(
      validatePhone(form.phone),
      form.verificationCode ? "" : "Mã xác minh là bắt buộc.",
      validatePassword(form.newPassword),
      form.confirmPassword === form.newPassword ? "" : "Mật khẩu nhập lại không khớp."
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        phone: form.phone,
        verificationCode: form.verificationCode,
        newPassword: form.newPassword
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Quên mật khẩu</p>
      <h2>Đặt lại mật khẩu</h2>

      <form className="stack" onSubmit={requested ? resetPassword : requestCode}>
        <label className="field">
          <span>Số điện thoại</span>
          <div className="input-icon">
            <Phone size={18} />
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={13} />
          </div>
        </label>

        {requested && (
          <>
            <label className="field">
              <span>Mã xác minh</span>
              <div className="input-icon">
                <KeyRound size={18} />
                <input value={form.verificationCode} onChange={(e) => update("verificationCode", e.target.value)} required maxLength={12} />
              </div>
            </label>
            <label className="field">
              <span>Mật khẩu mới</span>
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input type="password" value={form.newPassword} onChange={(e) => update("newPassword", e.target.value)} required minLength={8} maxLength={72} />
              </div>
            </label>
            <label className="field">
              <span>Nhập lại mật khẩu</span>
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                />
              </div>
            </label>
          </>
        )}

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <button className="button primary full" disabled={loading}>
          {loading ? "Đang xử lý..." : requested ? "Đặt lại mật khẩu" : "Gửi mã xác minh"}
        </button>
      </form>

      <p className="muted">
        Đã nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
