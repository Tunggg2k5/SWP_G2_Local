import { KeyRound, UsersRound } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatInheritanceChain, roleLabels } from "../../utils/roles.js";

export default function AccountManagement({
  loading,
  onCreateUser,
  onResetUserPassword,
  onUpdateUserStatus,
  onUserFormChange,
  userForm,
  users
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <UsersRound size={20} />
          <h2>Tạo tài khoản</h2>
        </div>
        <form className="form-grid" onSubmit={onCreateUser}>
          <label className="field">
            <span>Họ tên</span>
            <input value={userForm.fullName} onChange={(event) => onUserFormChange({ fullName: event.target.value })} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={userForm.email} onChange={(event) => onUserFormChange({ email: event.target.value })} required />
          </label>
          <label className="field">
            <span>Số điện thoại</span>
            <input value={userForm.phone} onChange={(event) => onUserFormChange({ phone: event.target.value })} />
          </label>
          <label className="field">
            <span>Vai trò</span>
            <select value={userForm.role} onChange={(event) => onUserFormChange({ role: event.target.value })}>
              <option value="patient">Bệnh nhân</option>
              <option value="receptionist">Lễ tân</option>
              <option value="dentist">Bác sĩ</option>
              <option value="nurse">Y tá</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </label>
          <button className="button secondary">Tạo tài khoản</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <UsersRound size={20} />
          <h2>Tài khoản hệ thống</h2>
        </div>
        {loading ? (
          <EmptyState title="Đang tải tài khoản" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : users.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Phân quyền</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{roleLabels[user.role] || user.role}</td>
                    <td>{formatInheritanceChain(user.inheritanceChain, user.role)}</td>
                    <td>
                      <StatusBadge value={user.status} />
                    </td>
                    <td>
                      <div className="row-actions account-actions">
                        <button className="button small ghost" type="button" onClick={() => onResetUserPassword(user)} title="Đặt lại mật khẩu">
                          <KeyRound size={15} />
                          Đặt lại MK
                        </button>
                        <button
                          className="button small"
                          type="button"
                          onClick={() => onUpdateUserStatus(user._id, user.status === "active" ? "inactive" : "active")}
                        >
                          {user.status === "active" ? "Ngưng" : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </>
  );
}
