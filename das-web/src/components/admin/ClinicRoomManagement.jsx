import { DoorOpen } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function ClinicRoomManagement({
  dentistUsers,
  loading,
  onCreateRoom,
  onRoomFormChange,
  onUpdateRoom,
  roomForm,
  rooms
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <DoorOpen size={20} />
          <h2>Tạo phòng khám</h2>
        </div>
        <form className="form-grid" onSubmit={onCreateRoom}>
          <label className="field">
            <span>Tên phòng</span>
            <input value={roomForm.name} onChange={(event) => onRoomFormChange({ name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Bác sĩ phụ trách</span>
            <select value={roomForm.assignedDentist} onChange={(event) => onRoomFormChange({ assignedDentist: event.target.value })}>
              <option value="">Chưa gán</option>
              {dentistUsers.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Trạng thái</span>
            <select value={roomForm.status} onChange={(event) => onRoomFormChange({ status: event.target.value })}>
              <option value="available">Sẵn sàng</option>
              <option value="maintenance">Bảo trì</option>
              <option value="unavailable">Tạm ngưng</option>
            </select>
          </label>
          <label className="field wide">
            <span>Mô tả</span>
            <textarea value={roomForm.description} onChange={(event) => onRoomFormChange({ description: event.target.value })} rows="3" />
          </label>
          <button className="button primary">Thêm phòng</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <DoorOpen size={20} />
          <h2>Phòng khám</h2>
        </div>
        <div className="mini-list">
          {loading ? (
            <EmptyState title="Đang tải phòng khám" text="Hệ thống đang lấy dữ liệu mới nhất." />
          ) : rooms.map((room) => (
            <div className="mini-row" key={room._id}>
              <span>{room.name}</span>
              <span>{room.assignedDentist?.fullName || "Chưa gán bác sĩ"}</span>
              <StatusBadge value={room.status} />
              <button className="button small" onClick={() => onUpdateRoom(room._id, room.status === "maintenance" ? "available" : "maintenance")}>
                {room.status === "maintenance" ? "Mở" : "Bảo trì"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
