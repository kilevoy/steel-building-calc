/**
 * Read-only text field used to display catalog-derived crane parameters
 * (wheel load, base, gauge).
 */
export function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input type="text" readOnly value={value} />
      {hint && <div className="field__hint">{hint}</div>}
    </div>
  );
}
