import ForgotPasswordForm from "../components/auth/ForgotPasswordForm.jsx";
import LoginForm from "../components/auth/LoginForm.jsx";
import RegisterForm from "../components/auth/RegisterForm.jsx";

export default function AuthPage({ mode }) {
  return (
    <section className="auth-grid">
      <div className="panel auth-panel">
        {mode === "register" ? <RegisterForm /> : mode === "forgot" ? <ForgotPasswordForm /> : <LoginForm />}
      </div>

      <div className="panel demo-panel">
        <h3>Tài khoản demo sau khi seed</h3>
        <ul className="demo-list">
          <li>Admin: 0900000000</li>
          <li>Lễ tân: 0901000001</li>
          <li>Bác sĩ: 0902000001</li>
          <li>Y tá: 0903000001</li>
          <li>Bệnh nhân: 0911000001</li>
        </ul>
        <p className="muted">Mật khẩu chung: Password123!</p>
      </div>
    </section>
  );
}
