/**
 * Read-only text field used to display catalog-derived crane parameters
 * (wheel load, base, gauge). Extracted from `App.tsx` without changes.
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
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, display: "block" }}>{label}</label>
      <input
        type="text"
        readOnly
        value={value}
        style={{
          width: "100%",
          padding: 4,
          boxSizing: "border-box",
          background: "#f8fafc",
          color: "#475569",
        }}
      />
      {hint && <div style={{ fontSize: 11, color: "#888" }}>{hint}</div>}
    </div>
  );
}
