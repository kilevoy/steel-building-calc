/**
 * Plain <select> with [value, label] tuples. Cross-tab synced selects use
 * `building/SyncedField.SyncedSelectField` instead. Presentation comes
 * from the shared design system in `src/styles.css`.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
