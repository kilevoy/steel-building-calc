/**
 * Generic numeric input. Same `Number()` coercion and fallback step as the
 * original `App.tsx` helper; presentation comes from the shared design
 * system in `src/styles.css`.
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
    <div className="field">
      <label className="field__label">{label}</label>
      <input
        type="number"
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
