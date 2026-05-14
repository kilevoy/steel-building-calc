import { SyncedNumField, SyncedSelectField } from "../building/SyncedField";
import { Field, SelectField } from "../components/form";
import { CityCombobox } from "./CityCombobox";
import type { Building } from "../building/useBuilding";
import type { CalculationInput } from "../calc/types";

interface StructureRow {
  id: string;
  kPa: number;
}

interface RoofLoadBreakdown {
  structure_kPa: number;
  purlin_kPa: number;
  beamCell_kPa: number;
  total_kPa: number;
}

/**
 * Load inputs (city, terrain, w0/Sg, roof + wall structure, γn).
 * Auto-propagation hint above the roof-load field is rendered when other
 * tabs (purlins / beam cell) have published a roof self-weight.
 */
export function LoadsSection({
  input,
  structures,
  roofLoad,
  updSynced,
  upd,
  setWallStructure,
}: {
  input: CalculationInput;
  structures: readonly StructureRow[];
  roofLoad: RoofLoadBreakdown;
  updSynced: <K extends keyof Building>(key: K, value: Building[K]) => void;
  upd: (patch: Partial<CalculationInput>) => void;
  setWallStructure: (id: string) => void;
}) {
  return (
    <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
      <legend style={{ fontWeight: 600 }}>Нагрузки</legend>
      <CityCombobox />
      <SyncedSelectField
        label="Тип местности"
        value={input.terrainType}
        options={[
          ["A", "A — открытая"],
          ["B", "B — город/лес"],
          ["C", "C — плотная застройка"],
        ]}
        onChange={(v) => updSynced("terrainType", v as Building["terrainType"])}
      />
      <SyncedNumField label="w₀ (ветер), кПа" value={input.w0_kPa} onChange={(v) => updSynced("w0_kPa", v)} step={0.01} validationKind="nonNegative" />
      <SyncedNumField label="Sg (снег), кПа" value={input.Sg_kPa} onChange={(v) => updSynced("Sg_kPa", v)} step={0.01} validationKind="nonNegative" />
      <SyncedSelectField
        label="Конструкция покрытия"
        value={input.roofStructure}
        options={structures.map((s) => [s.id, `${s.id} (${s.kPa.toFixed(3)} кПа)`])}
        onChange={(v) => updSynced("roofStructure", v)}
      />
      <Field label="Нагрузка от кровли, кПа" value={input.roofLoad_kPa} onChange={(v) => upd({ roofLoad_kPa: v })} step={0.001} />
      {(roofLoad.purlin_kPa > 0 || roofLoad.beamCell_kPa > 0) && (
        <div style={{ fontSize: 11, color: "#0369a1", marginTop: -4, marginBottom: 6 }}>
          🔗 авто: {roofLoad.structure_kPa.toFixed(3)} (покрытие)
          {roofLoad.purlin_kPa > 0 && ` + ${roofLoad.purlin_kPa.toFixed(3)} (прогоны)`}
          {roofLoad.beamCell_kPa > 0 && ` + ${roofLoad.beamCell_kPa.toFixed(3)} (балка покр.)`}
          {" = "}
          <b>{roofLoad.total_kPa.toFixed(3)} кПа</b>
        </div>
      )}
      <SelectField
        label="Конструкция ограждения"
        value={input.wallStructure}
        options={structures.map((s) => [s.id, `${s.id} (${s.kPa.toFixed(3)} кПа)`])}
        onChange={setWallStructure}
      />
      <Field label="Нагрузка от ограждения, кПа" value={input.wallLoad_kPa} onChange={(v) => upd({ wallLoad_kPa: v })} step={0.001} />
      <SyncedNumField label="Ур. ответственности γₙ" value={input.responsibilityCoeff} onChange={(v) => updSynced("responsibilityCoeff", v)} step={0.05} />
    </fieldset>
  );
}
