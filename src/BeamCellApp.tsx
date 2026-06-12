import { useMemo, useState, useEffect } from "react";
import { calculate, defaultInputs } from "./calc/beamCell/engine";
import { useBuilding, type Building } from "./building/useBuilding";
import { useBuildingResults } from "./building/useBuildingResults";
import { SyncedNumField } from "./building/SyncedField";
import { PricesBlock } from "./building/PricesBlock";
import { Collapsible } from "./building/Collapsible";
import { deriveEndRoofBeamLayout } from "./building/layout";
import { buildBeamCellResultItem } from "./beamCellResultPublisher";
import { ReadOnlyField } from "./components/form";
import type {
  CalculatorInputs,
  MemberSolution,
  Steel,
} from "./calc/beamCell/types";

const STEELS: readonly Steel[] = ["C245", "C345"];

function roofBeamSpan_m(building: Building): number {
  return deriveEndRoofBeamLayout({
    span_m: building.span_m,
    roofSlope_deg: building.roofSlope_deg,
    roofShape: building.roofShape,
    spanCount: building.spanCount,
  }).lengthPerPiece_m;
}

function fmtKg(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  return `${v.toFixed(1)} кг`;
}
function fmtRub(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  return `${(v / 1000).toFixed(2)} тыс. ₽`;
}
function fmtN(v: number | undefined, digits = 2): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

function solutionText(s: MemberSolution): string {
  if (s.status === "OK") return s.profile ?? "—";
  if (s.status === "SKIPPED") return "—";
  return "нет решения";
}

export function BeamCellApp() {
  const { building, setBuilding } = useBuilding();
  // Lock to "балка покрытия" mode — only ГБ is calculated
  const [inputs, setInputs] = useState<CalculatorInputs>(() => ({
    ...defaultInputs,
    floorType: "балка покрытия",
    mainBeamSpan: roofBeamSpan_m(building),
    mainBeamStep: building.framePitch_m,
    prices: {
      ...defaultInputs.prices,
      ibeamC245: building.priceC245_rubKg,
      ibeamC345: building.priceC345_rubKg,
    },
  }));

  useEffect(() => {
    setInputs((cur) => ({
      ...cur,
      mainBeamSpan: roofBeamSpan_m(building),
      mainBeamStep: building.framePitch_m,
      prices: {
        ...cur.prices,
        ibeamC245: building.priceC245_rubKg,
        ibeamC345: building.priceC345_rubKg,
      },
    }));
  }, [
    building,
  ]);

  const updSynced = <K extends keyof Building>(key: K, value: number) => {
    setBuilding({ [key]: value } as Partial<Building>);
  };

  const result = useMemo(() => calculate(inputs), [inputs]);
  const upd = <K extends keyof CalculatorInputs>(k: K, v: CalculatorInputs[K]) =>
    setInputs((cur) => ({ ...cur, [k]: v }));

  // Publish accepted main beam selection to shared results bus for the Summary tab.
  const { setResult } = useBuildingResults();
  useEffect(() => {
    const item = buildBeamCellResultItem({
      solution: result.main[inputs.acceptedMainSteel],
      length_m: building.length_m,
      framePitch_m: building.framePitch_m,
      span_m: building.span_m,
      roofSlope_deg: building.roofSlope_deg,
      roofShape: building.roofShape,
      spanCount: building.spanCount,
    });
    if (!item) {
      setResult("beamCell", null);
      return;
    }
    setResult("beamCell", item);
  }, [
    result,
    inputs.acceptedMainSteel,
    building.length_m,
    building.framePitch_m,
    building.span_m,
    building.roofSlope_deg,
    building.roofShape,
    building.spanCount,
    setResult,
  ]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Балка покрытия</h2>
      <p className="text-muted text-small" style={{ marginTop: 0 }}>
        Подбор главной балки (ГБ) покрытия — прокатный двутавр по сортаменту, с учётом снеговой
        нагрузки и собственного веса. Расчёт по СП 16.13330.
      </p>

      <div style={{ marginBottom: 16 }}>
       <Collapsible title="📥 Исходные данные" storageKey="beamcell-inputs" defaultOpen={true}>
      <div className="grid grid--3" style={{ gap: 12 }}>
        {/* Column 1: Geometry */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <legend style={{ fontWeight: 600 }}>Геометрия</legend>
          <NumField label="Вдоль ГБ, м" value={inputs.lengthAlongMain} step={0.5} onChange={(v) => upd("lengthAlongMain", v)} />
          <NumField label="Поперёк ГБ, м" value={inputs.widthAcrossMain} step={0.5} onChange={(v) => upd("widthAcrossMain", v)} />
          <SyncedNumField label="Пролёт здания, м" value={building.span_m} step={0.5} onChange={(v) => updSynced("span_m", v)} validationKind="positive" />
          <ReadOnlyField label="Расчётная длина балки покрытия, м" value={inputs.mainBeamSpan.toFixed(2)} />
          <SyncedNumField label="Шаг ГБ (= шаг рам), м" value={inputs.mainBeamStep} step={0.5} onChange={(v) => updSynced("framePitch_m", v)} validationKind="positive" />
        </fieldset>

        {/* Column 2: Loads */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <legend style={{ fontWeight: 600 }}>Нагрузка</legend>
          <NumField
            label="Снеговая + кровля, кг/м²"
            value={inputs.floorLoadKgM2}
            step={5}
            onChange={(v) => upd("floorLoadKgM2", v)}
          />
          <div className="text-small text-muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div>q расчётная = <b>{fmtN(result.qMain)} кН/м²</b></div>
            <div className="text-warn" style={{ marginTop: 6 }}>
              ВБ (второстепенные балки) и колонны в этом режиме не считаются.
            </div>
          </div>
        </fieldset>

        {/* Column 3: Steel */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <legend style={{ fontWeight: 600 }}>Сталь</legend>
          <SelField
            label="Сталь ГБ (для итога ★)"
            value={inputs.acceptedMainSteel}
            options={STEELS.map((s) => [s, s])}
            onChange={(v) => upd("acceptedMainSteel", v as Steel)}
          />
          <div className="text-small text-muted" style={{ marginTop: 8 }}>
            Цены С245/С345 — в общем блоке «Цены стали» ниже (синхронизированы между всеми вкладками).
          </div>
        </fieldset>
      </div>
       </Collapsible>
      </div>

      <div style={{ marginTop: 12 }}>
        <PricesBlock />
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3 style={{ marginTop: 0 }}>Подобранная балка покрытия (ГБ)</h3>

      <ResultTable
        rows={[result.main.C245, result.main.C345]}
        accepted={inputs.acceptedMainSteel}
      />

      {result.warnings.length > 0 && (
        <div className="text-small text-warn" style={{ marginTop: 12 }}>
          {result.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultTable({
  rows,
  accepted,
}: {
  rows: MemberSolution[];
  accepted: Steel;
}) {
  return (
    <div className="table-wrap">
      <table className="table" style={{ maxWidth: 800 }}>
        <thead>
          <tr>
            <th>Сталь</th>
            <th>Профиль</th>
            <th>Масса 1 балки</th>
            <th>Стоимость 1 балки</th>
            <th className="num">K (использование)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isAccepted = r.material === accepted;
            return (
              <tr key={r.material} style={isAccepted ? { background: "#fffbeb" } : undefined}>
                <td>
                  <b>{r.material}</b>
                  {isAccepted ? " ★" : ""}
                </td>
                <td>{solutionText(r)}</td>
                <td>{fmtKg(r.weightKg)}</td>
                <td>{fmtRub(r.costRub)}</td>
                <td className="num">{r.utilization === undefined ? "—" : r.utilization.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function SelField({
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
