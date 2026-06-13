import RatingInput from "./RatingInput.jsx";

export default function ReviewForm({ form, onChange, onSubmit }) {
  return (
    <form className="appointment-review-form" onSubmit={onSubmit}>
      <RatingInput value={form.rating} onChange={(rating) => onChange({ rating })} />
      <input
        value={form.comment}
        onChange={(event) => onChange({ comment: event.target.value })}
        placeholder="Nhận xét"
        maxLength={1000}
      />
      <button className="button small secondary">Gửi đánh giá</button>
    </form>
  );
}
