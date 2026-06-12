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
    <fieldset className="card" style={{ padding: 12 }}>
      <legend className="section-title">Колонна и экономика</legend>
      <div className="text-small text-muted" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>μ по типу колонны (авто):</div>
        <div>Крайняя: <b>{muByType.edge.toFixed(2)}</b></div>
        <div>Фахверковая: <b>{muByType.fachwerk.toFixed(2)}</b></div>
        <div>Средняя: <b>{muByType.middle.toFixed(2)}</b></div>
        <div className="field__hint" style={{ marginTop: 2 }}>
          Считается по связям / кол-ву пролётов
        </div>
      </div>
      <Field label="Надбавка, %" value={input.loadAddition_pct} onChange={(v) => upd({ loadAddition_pct: v })} />
    </fieldset>
  );
}
