import { Search } from "lucide-react";

export default function ReceptionAppointmentFilters({
  appointmentSearch,
  date,
  rooms,
  roomFilter,
  setAppointmentSearch,
  setDate,
  setRoomFilter
}) {
  return (
    <div className="toolbar-row">
      <label className="field inline-field">
        <span>Ngày</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="field inline-field">
        <span>Phòng</span>
        <select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)}>
          <option value="all">Tất cả phòng</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field inline-field grow-field">
        <span>Tìm nhanh</span>
        <div className="input-with-icon">
          <Search size={17} />
          <input
            value={appointmentSearch}
            onChange={(event) => setAppointmentSearch(event.target.value)}
            placeholder="Tên, SĐT, dịch vụ, phòng hoặc bác sĩ"
          />
        </div>
      </label>
    </div>
  );
}
