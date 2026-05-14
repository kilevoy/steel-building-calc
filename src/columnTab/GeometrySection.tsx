import { SyncedNumField, SyncedSelectField } from "../building/SyncedField";
import { CheckField, Field, SelectField } from "../components/form";
import type { Building } from "../building/useBuilding";
import type { CalculationInput, SpanCount } from "../calc/types";

/**
 * Geometry inputs for the column tab. Synced fields write through to the
 * shared `Building` context; local fields update the column-specific
 * `CalculationInput`. Behaviour preserved from the original `App.tsx`.
 */
export function GeometrySection({
  input,
  building,
  updSynced,
  upd,
}: {
  input: CalculationInput;
  building: Building;
  updSynced: <K extends keyof Building>(key: K, value: Building[K]) => void;
  upd: (patch: Partial<CalculationInput>) => void;
}) {
  return (
    <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
      <legend style={{ fontWeight: 600 }}>Геометрия здания</legend>
      <SyncedNumField label="Пролёт, м" value={input.span_m} onChange={(v) => updSynced("span_m", v)} validationKind="positive" />
      <SyncedNumField label="Длина, м" value={input.length_m} onChange={(v) => updSynced("length_m", v)} validationKind="positive" />
      <SyncedNumField label="Высота, м" value={input.height_m} onChange={(v) => updSynced("height_m", v)} validationKind="positive" />
      <SyncedNumField label="Уклон кровли, °" value={input.roofSlope_deg} onChange={(v) => updSynced("roofSlope_deg", v)} />
      <SyncedNumField label="Шаг рам, м" value={input.framePitch_m} onChange={(v) => updSynced("framePitch_m", v)} validationKind="positive" />
      <Field label="Шаг стоек фахверка, м" value={input.fachverkPitch_m} onChange={(v) => upd({ fachverkPitch_m: v })} />
      <SelectField
        label="Кол-во пролётов"
        value={input.spanCount}
        options={[
          ["single", "Один"],
          ["multi", "Более одного"],
        ]}
        onChange={(v) => updSynced("spanCount", v as SpanCount)}
      />
      <SyncedSelectField
        label="Кровля"
        value={building.roofShape}
        options={[
          ["gable", "Двускатная"],
          ["monoslope", "Односкатная"],
        ]}
        onChange={(v) => updSynced("roofShape", v as Building["roofShape"])}
      />
      <CheckField
        label="Связи по периметру"
        checked={input.perimeterTies}
        onChange={(v) => upd({ perimeterTies: v })}
      />
    </fieldset>
  );
}
