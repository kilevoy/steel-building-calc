import { Field } from "../components/form";
import type { CalculationInput, ColumnType } from "../calc/types";

/**
 * "Колонна и экономика" panel: μ-by-type readout and the load-addition
 * percent input. μ values are precomputed by the caller via `computeMu`
 * to keep this component pure.
 */
export function EconomySection({
  input,
  muByType,
  upd,
}: {
  input: CalculationInput;
  muByType: Record<ColumnType, number>;
  upd: (patch: Partial<CalculationInput>) => void;
}) {
  return (
    <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
      <legend style={{ fontWeight: 600 }}>Колонна и экономика</legend>
      <div style={{ marginBottom: 6, fontSize: 12, color: "#475569" }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>μ по типу колонны (авто):</div>
        <div>Крайняя: <b>{muByType.edge.toFixed(2)}</b></div>
        <div>Фахверковая: <b>{muByType.fachwerk.toFixed(2)}</b></div>
        <div>Средняя: <b>{muByType.middle.toFixed(2)}</b></div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          Считается по связям / кол-ву пролётов
        </div>
      </div>
      <Field label="Надбавка, %" value={input.loadAddition_pct} onChange={(v) => upd({ loadAddition_pct: v })} />
    </fieldset>
  );
}
