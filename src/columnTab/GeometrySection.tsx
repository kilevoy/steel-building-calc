import { SyncedNumField, SyncedSelectField } from "../building/SyncedField";
import { CheckField, Field, SelectField } from "../components/form";
import type { Building } from "../building/useBuilding";
import type { CalculationInput, SpanCount } from "../calc/types";
import { deriveFrameAxisLayout } from "../building/layout";

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
  const frameLayout = deriveFrameAxisLayout({
    length_m: building.length_m,
    framePitch_m: building.framePitch_m,
    mode: building.frameLayoutMode,
    centralBayCount: building.centralBayCount,
  });

  return (
    <fieldset className="card" style={{ padding: 12 }}>
      <legend className="section-title">Геометрия здания</legend>
      <SyncedNumField label="Ширина здания, м" value={input.span_m} onChange={(v) => updSynced("span_m", v)} validationKind="positive" />
      <SyncedNumField label="Длина, м" value={input.length_m} onChange={(v) => updSynced("length_m", v)} validationKind="positive" />
      <SyncedNumField label="Высота, м" value={input.height_m} onChange={(v) => updSynced("height_m", v)} validationKind="positive" />
      <SyncedNumField label="Уклон кровли, °" value={input.roofSlope_deg} onChange={(v) => updSynced("roofSlope_deg", v)} />
      <SyncedNumField
        label={building.frameLayoutMode === "uniform" ? "Шаг рам, м" : "Шаг центральных пролётов, м"}
        value={input.framePitch_m}
        onChange={(v) => updSynced("framePitch_m", v)}
        validationKind="positive"
      />
      <SyncedSelectField
        label="Разбивка здания"
        value={building.frameLayoutMode}
        options={[
          ["uniform", "Равномерный шаг"],
          ["central_with_end_bays", "Центральные пролёты и торцы"],
        ]}
        onChange={(v) => updSynced("frameLayoutMode", v as Building["frameLayoutMode"])}
      />
      {building.frameLayoutMode === "central_with_end_bays" && (
        <>
          <SyncedNumField
            label="Центральных пролётов, шт."
            value={building.centralBayCount}
            step={1}
            onChange={(v) => updSynced("centralBayCount", v)}
            validationKind="positive"
          />
          <div className={frameLayout.validationError ? "field__error" : "field__hint"}>
            {frameLayout.validationError ?? (
              <>
                Торцевые пролёты: {frameLayout.endBayLength_m} м + {frameLayout.endBayLength_m} м.
                Оси: {frameLayout.axisPositions_m.join("; ")} м. Всего осей: {frameLayout.frameCount}.
              </>
            )}
          </div>
        </>
      )}
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
        checked={building.perimeterTies}
        onChange={(v) => updSynced("perimeterTies", v)}
      />
    </fieldset>
  );
}
