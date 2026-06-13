import { useEffect, useMemo, useState } from "react";
import { useBuilding } from "./building/useBuilding";
import {
  calculateProjectWork,
  defaultProjectWorkInputs,
} from "./calc/projectWork/engine";
import type {
  ProjectWorkInputs,
  RoofKind,
  SeismicCategory,
  WallMaterial,
} from "./calc/projectWork/types";

/**
 * Вкладка «Проектные работы» — стоимость и срок проектирования раздела КМ
 * для ангара «Великан» (источник EXCEL-011, расчёт через HyperFormula).
 *
 * Геометрия берётся из общего BuildingContext (пролёт, длина, шаг рам,
 * высота, форма кровли, краны). Проектные опции (стены, проёмы, сейсмика,
 * издержки) задаются здесь и хранятся локально для вкладки.
 */

interface ProjectOptions {
  seismic: SeismicCategory;
  wallMaterial: WallMaterial;
  wallThickness: number;
  windows: boolean;
  windowCount: number;
  gates: boolean;
  doors: boolean;
  doorCount: number;
  overheadCraneCapacity: number;
  suspendedCrane: boolean;
  suspendedCraneCapacity: number;
  overheadCostPercent: number;
}

const DEFAULT_OPTIONS: ProjectOptions = {
  seismic: 1,
  wallMaterial: 1,
  wallThickness: 2,
  windows: true,
  windowCount: 13,
  gates: false,
  doors: true,
  doorCount: 3,
  overheadCraneCapacity: 1,
  suspendedCrane: false,
  suspendedCraneCapacity: 1,
  overheadCostPercent: 0,
};

const ROOF_LABEL: Record<RoofKind, string> = {
  1: "односкатная",
  2: "двускатная",
  3: "плоская",
  4: "многоскатная",
};

function fmtMoney(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtNum(v: number | null, digits = 1): string {
  if (v === null) return "—";
  return v.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function ProjectWorkApp() {
  const { building } = useBuilding();
  const [opt, setOpt] = useState<ProjectOptions>(DEFAULT_OPTIONS);

  // Геометрия из общего здания. span_m — ПОЛНАЯ ширина здания поперёк;
  // при нескольких пролётах она делится поровну между ними (книга ИНСИ
  // подбирает коэффициент по ширине каждого пролёта). Форма кровли
  // gable→двускатная(2), monoslope→односкатная(1).
  const spanCount = building.spanCount === "multi" ? 2 : 1;
  const roof: RoofKind = building.roofShape === "gable" ? 2 : 1;
  const perSpanWidth = building.span_m / spanCount;

  const inputs: ProjectWorkInputs = useMemo(
    () => ({
      ...defaultProjectWorkInputs,
      spanCount,
      spanWidth1: perSpanWidth,
      spanWidth2: spanCount >= 2 ? perSpanWidth : 0,
      spanWidth3: 0,
      spanWidth4: 0,
      spanWidth5: 0,
      length: building.length_m,
      framePitch: building.framePitch_m,
      height: building.height_m,
      roof,
      seismic: opt.seismic,
      wallMaterial: opt.wallMaterial,
      wallThickness: opt.wallThickness,
      windows: opt.windows,
      windowCount: opt.windowCount,
      gates: opt.gates,
      doors: opt.doors,
      doorCount: opt.doorCount,
      overheadCrane: building.hasCrane,
      overheadCraneCapacity: opt.overheadCraneCapacity,
      suspendedCrane: opt.suspendedCrane,
      suspendedCraneCapacity: opt.suspendedCraneCapacity,
      overheadCost: opt.overheadCostPercent / 100,
    }),
    [building, spanCount, perSpanWidth, roof, opt],
  );

  const [result, setResult] = useState(() => calculateProjectWork(inputs));
  useEffect(() => {
    setResult(calculateProjectWork(inputs));
  }, [inputs]);

  const upd = <K extends keyof ProjectOptions>(k: K, v: ProjectOptions[K]) =>
    setOpt((cur) => ({ ...cur, [k]: v }));

  // Площадь застройки = полная ширина × длина (совпадает со Сводкой).
  const area = building.span_m * building.length_m;

  return (
    <div>
      <h2 className="page-title">Проектные работы (Великан)</h2>
      <p className="text-muted text-small" style={{ marginTop: 0 }}>
        Стоимость и срок проектирования раздела КМ для ангара «Великан». Геометрия берётся
        из общих параметров здания; проектные опции задаются ниже.
      </p>

      <div className="grid grid--3" style={{ gap: 12, marginBottom: 16 }}>
        <fieldset>
          <legend>Геометрия (из здания)</legend>
          <ReadOnly label="Ширина здания, м" value={fmtNum(building.span_m)} />
          <ReadOnly label="Пролётов поперёк" value={String(spanCount)} />
          <ReadOnly label="Длина, м" value={fmtNum(building.length_m)} />
          <ReadOnly label="Шаг рам, м" value={fmtNum(building.framePitch_m)} />
          <ReadOnly label="Высота, м" value={fmtNum(building.height_m)} />
          <ReadOnly label="Кровля" value={ROOF_LABEL[roof]} />
          <ReadOnly label="Площадь застройки, м²" value={fmtNum(area)} />
          <div className="field__hint">Меняется на вкладке «Колонна» и в общем здании.</div>
        </fieldset>

        <fieldset>
          <legend>Ограждающие конструкции</legend>
          <Select
            label="Материал стен"
            value={String(opt.wallMaterial)}
            options={[["1", "профлист"], ["2", "сэндвич послойно"], ["3", "сэндвич заводской"]]}
            onChange={(v) => upd("wallMaterial", Number(v) as WallMaterial)}
          />
          <Num label="Толщина стен (индекс)" value={opt.wallThickness} onChange={(v) => upd("wallThickness", v)} />
          <Check label="Окна" checked={opt.windows} onChange={(v) => upd("windows", v)} />
          {opt.windows && (
            <Num label="Количество окон" value={opt.windowCount} onChange={(v) => upd("windowCount", v)} />
          )}
          <Check label="Ворота" checked={opt.gates} onChange={(v) => upd("gates", v)} />
          <Check label="Двери" checked={opt.doors} onChange={(v) => upd("doors", v)} />
          {opt.doors && (
            <Num label="Количество дверей" value={opt.doorCount} onChange={(v) => upd("doorCount", v)} />
          )}
        </fieldset>

        <fieldset>
          <legend>Краны и условия</legend>
          <ReadOnly label="Опорный кран" value={building.hasCrane ? "есть (из здания)" : "нет"} />
          {building.hasCrane && (
            <Num
              label="Г/п опорного крана (индекс)"
              value={opt.overheadCraneCapacity}
              onChange={(v) => upd("overheadCraneCapacity", v)}
            />
          )}
          <Check label="Подвесной кран" checked={opt.suspendedCrane} onChange={(v) => upd("suspendedCrane", v)} />
          {opt.suspendedCrane && (
            <Num
              label="Г/п подвесного (индекс)"
              value={opt.suspendedCraneCapacity}
              onChange={(v) => upd("suspendedCraneCapacity", v)}
            />
          )}
          <Select
            label="Сейсмичность"
            value={String(opt.seismic)}
            options={[["1", "несейсмический"], ["2", "категория 2"], ["3", "категория 3"], ["4", "категория 4"]]}
            onChange={(v) => upd("seismic", Number(v) as SeismicCategory)}
          />
          <Num
            label="Издержки, %"
            value={opt.overheadCostPercent}
            step={1}
            onChange={(v) => upd("overheadCostPercent", v)}
          />
        </fieldset>
      </div>

      <fieldset>
        <legend>Результат — раздел КМ</legend>
        <div className="grid grid--3" style={{ gap: 16 }}>
          <Stat label="Стоимость проектных работ, тыс. руб" value={fmtMoney(result.kmCostThousandRub)} />
          <Stat label="Срок проектирования, раб. дней" value={fmtNum(result.kmDurationDays)} />
          <Stat label="Удельно, тыс. руб/т (35 кг/м²)" value={fmtNum(result.costPerTon, 2)} />
        </div>
        <div className="field__hint" style={{ marginTop: 8 }}>
          Расчёт по книге ИНСИ (EXCEL-011), конструктив «Великан». Пересчитывается автоматически.
        </div>
      </fieldset>
    </div>
  );
}

/* ——— локальные form-компоненты вкладки ——— */

function Num({
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
      <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Select({
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
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="check">
      <label>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input type="text" readOnly value={value} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  );
}
