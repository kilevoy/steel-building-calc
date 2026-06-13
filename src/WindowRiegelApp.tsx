import { useMemo, useState, useEffect } from "react";
import { useBuilding, type Building } from "./building/useBuilding";
import { useBuildingResults } from "./building/useBuildingResults";
import { SyncedNumField, SyncedSelectField } from "./building/SyncedField";
import { PricesBlock } from "./building/PricesBlock";
import { Collapsible } from "./building/Collapsible";
import {
  calculateWindowRiegel,
  defaultWindowRiegelInputs,
  findClimateSettlement,
  windowRiegelClimateSettlements,
  windowRiegelOptions,
} from "./calc/windowRiegel/engine";
import type {
  WindowRiegelInputs,
  WindowRiegelOption,
} from "./calc/windowRiegel/types";
import { buildWindowRiegelResultItem } from "./windowRiegelResultPublisher";

function fmt(n: number | null | undefined, digits = 3): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}
function fmtKg(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} кг`;
}

const WINDOW_TYPE_LABELS: Record<number, string> = {
  1: "Тип 1 (без стоек)",
  2: "Тип 2 (2 стойки)",
  3: "Тип 3 (2 стойки)",
  4: "Тип 4 (1 стойка)",
  5: "Тип 5 (2 стойки)",
};

export function WindowRiegelApp() {
  const { building, setBuilding } = useBuilding();
  const [inputs, setInputs] = useState<WindowRiegelInputs>(() => ({
    ...defaultWindowRiegelInputs,
    buildingSpanM: building.span_m,
    buildingLengthM: building.length_m,
    buildingHeightM: building.height_m,
    frameStepM: building.framePitch_m,
    windLoadKpa: building.w0_kPa,
    city: building.city || defaultWindowRiegelInputs.city,
    terrainType: building.terrainType,
    responsibilityLevel: building.responsibilityCoeff,
  }));

  useEffect(() => {
    setInputs((cur) => ({
      ...cur,
      buildingSpanM: building.span_m,
      buildingLengthM: building.length_m,
      buildingHeightM: building.height_m,
      frameStepM: building.framePitch_m,
      windLoadKpa: building.w0_kPa,
      city: building.city || cur.city,
      terrainType: building.terrainType,
      responsibilityLevel: building.responsibilityCoeff,
    }));
  }, [building]);

  const updSynced = <K extends keyof Building>(key: K, value: Building[K]) => {
    setBuilding({ [key]: value } as Partial<Building>);
  };

  const result = useMemo(() => {
    try {
      return calculateWindowRiegel(inputs);
    } catch {
      return null;
    }
  }, [inputs]);

  // Publish selected riegel to the shared results bus; count is a summary-level input.
  const { setResult } = useBuildingResults();
  useEffect(() => {
    const item = buildWindowRiegelResultItem(result, {
      count: building.windowRiegelCount,
      priceC245_rubKg: building.priceC245_rubKg,
      priceC345_rubKg: building.priceC345_rubKg,
    });
    if (!item) {
      setResult("windowRiegel", null);
      return;
    }
    setResult("windowRiegel", item);
  }, [
    building.priceC245_rubKg,
    building.priceC345_rubKg,
    building.windowRiegelCount,
    result,
    setResult,
  ]);

  const upd = <K extends keyof WindowRiegelInputs>(k: K, v: WindowRiegelInputs[K]) =>
    setInputs((cur) => ({ ...cur, [k]: v }));

  const setCity = (city: string) => {
    const climate = findClimateSettlement(city);
    setInputs((cur) => ({ ...cur, city }));
    const patch: Partial<Building> = { city };
    if (typeof climate?.w0Kpa === "number") patch.w0_kPa = climate.w0Kpa;
    setBuilding(patch);
  };

  return (
    <div>
      <h2 className="page-title">Оконные ригели</h2>
      <div style={{ marginBottom: 16 }}>
       <Collapsible title="📥 Исходные данные" storageKey="windowriegel-inputs" defaultOpen={true}>
      <div className="grid grid--3" style={{ gap: 12 }}>
        {/* Column 1: Geometry */}
        <fieldset>
          <legend style={{ fontWeight: 600 }}>Геометрия здания и окна</legend>
          <div className="synced-field" title="Синхронизировано со всеми вкладками">
            <label className="field__label">
              <span className="synced-field__badge">🔗</span>
              Город (автозаполнение w₀)
            </label>
            <input
              list="window-riegel-cities"
              value={inputs.city}
              onChange={(e) => setCity(e.target.value)}
            />
            <datalist id="window-riegel-cities">
              {windowRiegelClimateSettlements.slice(0, 500).map((s) => (
                <option key={s.id} value={s.settlement}>
                  {s.region}
                </option>
              ))}
            </datalist>
          </div>
          <NumField label="Высота окна, м" value={inputs.windowHeightM} step={0.1} onChange={(v) => upd("windowHeightM", v)} />
          <SyncedNumField label="Шаг рам, м" value={inputs.frameStepM} step={0.5} onChange={(v) => updSynced("framePitch_m", v)} validationKind="positive" />
          <SelField
            label="Тип окна"
            value={String(inputs.windowType)}
            options={windowRiegelOptions.windowTypes.map((t) => [String(t), WINDOW_TYPE_LABELS[t] ?? `Тип ${t}`])}
            onChange={(v) => upd("windowType", Number(v))}
          />
          <SyncedNumField label="Высота здания, м" value={inputs.buildingHeightM} step={0.5} onChange={(v) => updSynced("height_m", v)} validationKind="positive" />
          <SyncedNumField label="Ширина здания, м" value={inputs.buildingSpanM} step={1} onChange={(v) => updSynced("span_m", v)} validationKind="positive" />
          <SyncedNumField label="Длина здания, м" value={inputs.buildingLengthM} step={1} onChange={(v) => updSynced("length_m", v)} validationKind="positive" />
          <SyncedNumField
            label="Кол-во ригелей для сводки, шт."
            value={building.windowRiegelCount}
            step={1}
            onChange={(v) => updSynced("windowRiegelCount", Math.max(1, Math.floor(v)))}
            validationKind="positive"
            hint="Количество задаётся расчетчиком по фасадам; расчёт ниже подбирает один типовой ригель."
          />
          <p className="field__hint" style={{ marginTop: -2 }}>
            Количество нужно задать по фасадам вручную до появления отдельной модели окон.
          </p>
        </fieldset>

        {/* Column 2: Wind & loads */}
        <fieldset>
          <legend style={{ fontWeight: 600 }}>Ветер и нагрузки</legend>
          <SyncedSelectField
            label="Тип местности"
            value={String(inputs.terrainType)}
            options={windowRiegelOptions.terrainTypes.map((t) => [String(t), String(t)])}
            onChange={(v) => updSynced("terrainType", v as Building["terrainType"])}
          />
          <SyncedNumField label="Ветровая нагрузка w₀, кПа" value={inputs.windLoadKpa} step={0.01} onChange={(v) => updSynced("w0_kPa", v)} validationKind="nonNegative" />
          <SyncedSelectField
            label="Уровень ответственности γₙ"
            value={String(inputs.responsibilityLevel)}
            options={windowRiegelOptions.responsibilityLevels.map((r) => [String(r), String(r)])}
            onChange={(v) => updSynced("responsibilityCoeff", Number(v))}
          />
          <SelField
            label="Конструкция окна"
            value={String(inputs.windowConstruction)}
            options={windowRiegelOptions.windowConstructions.map((w) => [String(w), String(w)])}
            onChange={(v) => upd("windowConstruction", v)}
          />
          <NumField label="Макс. K-т использования" value={inputs.maxUtilization} step={0.01} onChange={(v) => upd("maxUtilization", v)} />
        </fieldset>

        {/* Column 3: Calculated loads */}
        <fieldset>
          <legend style={{ fontWeight: 600 }}>Расчётные нагрузки и длины</legend>
          <div className="text-small" style={{ lineHeight: 1.7 }}>
            <div>Вертикальная нагрузка: <b>{fmt(result?.verticalLoadKpa)} кПа</b></div>
            <div>Горизонтальная нагрузка: <b>{fmt(result?.horizontalLoadKpa)} кПа</b></div>
            <div>Эфф. ветер w₀: <b>{fmt(result?.effectiveWindLoadKpa, 2)} кПа</b></div>
            <div>Длина из плоскости: <b>{fmt(result?.outOfPlaneLengthM, 2)} м</b></div>
            <div>Длина в плоскости: <b>{fmt(result?.inPlaneLengthM, 2)} м</b></div>
            {result?.climateSettlement && (
              <div className="text-ok" style={{ marginTop: 6 }}>
                Климат: {result.climateSettlement.settlement} — w₀ {fmt(result.climateSettlement.w0Kpa, 2)} кПа
              </div>
            )}
            {result?.warnings.map((w, i) => (
              <div key={i} className="text-warn" style={{ marginTop: 4 }}>⚠ {w}</div>
            ))}
          </div>
        </fieldset>
      </div>
       </Collapsible>
      </div>

      <div style={{ marginTop: 16 }}>
        <PricesBlock />
      </div>

      <hr style={{ margin: "20px 0" }} />

      <div className="grid grid--2" style={{ gap: 12 }}>
        <RiegelTable
          title="Нижний ригель (для типов 1–5) и верхний (для типов 2–5)"
          rows={result?.lowerAndUpperProfiles ?? []}
        />
        <RiegelTable
          title="Верхний ригель для типа 1 (более жёсткий)"
          rows={result?.upperType1Profiles ?? []}
        />
      </div>
    </div>
  );
}

function RiegelTable({ title, rows }: { title: string; rows: WindowRiegelOption[] }) {
  return (
    <div>
      <h4 className="section-title" style={{ fontSize: 14 }}>{title}</h4>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>№</th>
              <th>Профиль</th>
              <th>Сталь</th>
              <th className="num">Масса 1 ригеля</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>Нет данных</td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className={i === 0 ? "row-accepted" : undefined}>
                  <td>{r.number}{i === 0 ? " ★" : ""}</td>
                  <td>{r.profile ?? "—"}</td>
                  <td>{r.steel ?? "—"}</td>
                  <td className="num">{fmtKg(r.weightKg)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
