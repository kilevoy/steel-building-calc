/**
 * Compact label/value pair shown in the result-summary row.
 */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  );
}
