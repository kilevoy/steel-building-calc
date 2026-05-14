/**
 * Generic numeric input. Mirrors the original `Field` helper from the
 * pre-decomposition `App.tsx` byte-for-byte: same styles, same `Number()`
 * coercion, same fallback step. Behaviour is preserved on purpose so the
 * extraction is a pure file move.
 */
export function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, display: "block" }}>{label}</label>
      <input
        type="number"
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", padding: 4, boxSizing: "border-box" }}
      />
    </div>
  );
}
