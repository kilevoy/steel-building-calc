import { CheckField, Field, ReadOnlyField, SelectField } from "../components/form";
import type { CalculationInput, CraneCapacity } from "../calc/types";

const CRANE_CAPACITIES: CraneCapacity[] = [
  "5", "8", "10", "12.5", "16", "16/3.2", "20/5", "32/5", "50/12.5",
];
const CRANE_SPANS = [12, 18, 24, 30, 36];

/**
 * Two side-by-side panels for overhead (опорный) and suspended
 * (подвесной) cranes. Catalog lookup for wheel load / base / gauge is
 * handled by `setOverhead` in the parent; this component only renders.
 */
export function CranesSection({
  input,
  setOverhead,
  setSuspended,
}: {
  input: CalculationInput;
  setOverhead: (patch: Partial<CalculationInput["overheadCrane"]>) => void;
  setSuspended: (patch: Partial<CalculationInput["suspendedCrane"]>) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
        <legend style={{ fontWeight: 600 }}>Кран опорный (по ГОСТ)</legend>
        <CheckField
          label="Есть"
          checked={input.overheadCrane.enabled}
          onChange={(v) => setOverhead({ enabled: v })}
        />
        {input.overheadCrane.enabled && (
          <>
            <SelectField
              label="Грузоподъёмность, т"
              value={input.overheadCrane.capacity}
              options={CRANE_CAPACITIES.map((c) => [c, c])}
              onChange={(v) => setOverhead({ capacity: v as CraneCapacity })}
            />
            <SelectField
              label="Пролёт крана (каталог), м"
              value={String(input.overheadCrane.span_m)}
              options={CRANE_SPANS.map((s) => [String(s), String(s)])}
              onChange={(v) => setOverhead({ span_m: Number(v) })}
            />
            <SelectField
              label="Кол-во кранов в пролёте"
              value={input.overheadCrane.count}
              options={[
                ["one", "Один"],
                ["two", "Два"],
              ]}
              onChange={(v) => setOverhead({ count: v as "one" | "two" })}
            />
            <CheckField
              label="Только в одном пролёте"
              checked={input.overheadCrane.singleSpan}
              onChange={(v) => setOverhead({ singleSpan: v })}
            />
            <Field
              label="Отметка верха рельса, м"
              value={input.overheadCrane.railLevel_m}
              onChange={(v) => setOverhead({ railLevel_m: v })}
              step={0.1}
            />
            <ReadOnlyField label="Нагрузка на колесо, кН" value={input.overheadCrane.wheelLoad_kN.toFixed(0)} />
            <ReadOnlyField label="База, м" value={input.overheadCrane.base_m.toFixed(2)} />
            <ReadOnlyField label="Габарит, м" value={input.overheadCrane.gauge_m.toFixed(2)} />
          </>
        )}
      </fieldset>
      <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
        <legend style={{ fontWeight: 600 }}>Кран подвесной</legend>
        <CheckField
          label="Есть"
          checked={input.suspendedCrane.enabled}
          onChange={(v) => setSuspended({ enabled: v })}
        />
        {input.suspendedCrane.enabled && (
          <>
            <Field
              label="Грузоподъёмность, т"
              value={input.suspendedCrane.capacity_t}
              onChange={(v) => setSuspended({ capacity_t: v })}
              step={0.5}
            />
            <CheckField
              label="Только в одном пролёте"
              checked={input.suspendedCrane.singleSpan}
              onChange={(v) => setSuspended({ singleSpan: v })}
            />
          </>
        )}
      </fieldset>
    </div>
  );
}
