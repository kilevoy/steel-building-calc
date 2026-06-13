import { useEffect, useMemo, useState } from "react";
import { useBuilding } from "./building/useBuilding";
import type { Building } from "./building/useBuilding";
import { SyncedNumField, SyncedSelectField } from "./building/SyncedField";
import { Collapsible } from "./building/Collapsible";
import {
  calculateProjectWork,
  defaultProjectWorkInputs,
} from "./calc/projectWork/engine";
import type {
  ParapetMode,
  ProjectWorkInputs,
  RoofKind,
  RoofingMaterial,
  SeismicCategory,
  StairType,
  WallMaterial,
} from "./calc/projectWork/types";

/**
 * Вкладка «Проектные работы» — стоимость и срок проектирования раздела КМ
 * для ангара «Великан» (источник EXCEL-011, расчёт через HyperFormula).
 *
 * Жёлтые поля 🔗 — общие со зданием (геометрия, кровля-форма, число
 * пролётов, сейсмика): редактируются здесь и синхронизируются со всеми
 * вкладками. Остальные опции специфичны для проектных работ.
 */

/** Сейсмичность (баллы MSK-64) → категория книги ИНСИ. */
function seismicPointsToCategory(points: number): SeismicCategory {
  if (points <= 6) return 1;
  if (points === 7) return 2;
  if (points === 8) return 3;
  return 4;
}

/** Проектные опции, не входящие в общую модель здания. */
interface ProjectOptions {
  wallMaterial: WallMaterial;
  wallThickness: number;
  roofingMaterial: RoofingMaterial;
  snowGuard: boolean;
  roofFence: boolean;
  drainage: boolean;
  windows: boolean;
  windowCount: number;
  gates: boolean;
  gateCount: number;
  gateSpanCount: number;
  doors: boolean;
  doorCount: number;
  partitionGvl: boolean;
  partitionSandwichLayered: boolean;
  partitionSandwichFactory: boolean;
  partitionOpeningsDoors: boolean;
  partitionOpeningsGates: boolean;
  parapetLongSide: ParapetMode;
  parapetEnd: ParapetMode;
  parapetOverhang: boolean;
  floor: boolean;
  mezzanine1: boolean;
  mezzanine2: boolean;
  mezzanine3: boolean;
  stairType: StairType;
  stairCount: number;
  fireResistance: number;
  overheadCraneCapacity: number;
  suspendedCrane: boolean;
  suspendedCraneCapacity: number;
  overheadCostPercent: number;
}

const DEFAULT_OPTIONS: ProjectOptions = {
  wallMaterial: 1,
  wallThickness: 2,
  roofingMaterial: 3,
  snowGuard: false,
  roofFence: false,
  drainage: false,
  windows: true,
  windowCount: 13,
  gates: false,
  gateCount: 1,
  gateSpanCount: 1,
  doors: true,
  doorCount: 3,
  partitionGvl: false,
  partitionSandwichLayered: false,
  partitionSandwichFactory: false,
  partitionOpeningsDoors: false,
  partitionOpeningsGates: false,
  parapetLongSide: 3,
  parapetEnd: 3,
  parapetOverhang: false,
  floor: false,
  mezzanine1: false,
  mezzanine2: false,
  mezzanine3: false,
  stairType: "none",
  stairCount: 1,
  fireResistance: 1,
  overheadCraneCapacity: 1,
  suspendedCrane: false,
  suspendedCraneCapacity: 1,
  overheadCostPercent: 0,
};

const PARAPET_OPTIONS: [string, string][] = [
  ["3", "нет"],
  ["1", "по одной стороне"],
  ["2", "по обеим"],
];

const STAIR_OPTIONS: [StairType, string][] = [
  ["none", "нет"],
  ["rcSingle", "Ж/Б, одномаршевая"],
  ["rcDouble", "Ж/Б, двухмаршевая"],
  ["rcTriple", "Ж/Б, трёхмаршевая"],
  ["rcQuad", "Ж/Б, четырёхмаршевая"],
  ["metalSingle", "металл, одномаршевая"],
  ["metalDouble", "металл, двухмаршевая"],
  ["metalTriple", "металл, трёхмаршевая"],
  ["metalQuad", "металл, четырёхмаршевая"],
];

function fmtMoney(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function fmtNum(v: number | null, digits = 1): string {
  if (v === null) return "—";
  return v.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function ProjectWorkApp() {
  const { building, setBuilding } = useBuilding();
  const [opt, setOpt] = useState<ProjectOptions>(DEFAULT_OPTIONS);

  const setB = <K extends keyof Building>(key: K, value: Building[K]) =>
    setBuilding({ [key]: value } as Partial<Building>);
  const upd = <K extends keyof ProjectOptions>(k: K, v: ProjectOptions[K]) =>
    setOpt((cur) => ({ ...cur, [k]: v }));

  const spanCount = building.spanCount === "multi" ? 2 : 1;
  const roof: RoofKind = building.roofShape === "gable" ? 2 : 1;
  const perSpanWidth = building.span_m / spanCount;

  const inputs: ProjectWorkInputs = useMemo(
    () => ({
      ...defaultProjectWorkInputs,
      spanCount,
      spanWidth1: perSpanWidth,
      spanWidth2: spanCount >= 2 ? perSpanWidth : 0,
      length: building.length_m,
      framePitch: building.framePitch_m,
      height: building.height_m,
      roof,
      seismic: seismicPointsToCategory(building.seismicPoints),
      overheadCrane: building.hasCrane,
      overheadCraneCapacity: opt.overheadCraneCapacity,
      suspendedCrane: opt.suspendedCrane,
      suspendedCraneCapacity: opt.suspendedCraneCapacity,
      wallMaterial: opt.wallMaterial,
      wallThickness: opt.wallThickness,
      roofingMaterial: opt.roofingMaterial,
      snowGuard: opt.snowGuard,
      roofFence: opt.roofFence,
      drainage: opt.drainage,
      windows: opt.windows,
      windowCount: opt.windowCount,
      gates: opt.gates,
      gateCount: opt.gateCount,
      gateSpanCount: opt.gateSpanCount,
      doors: opt.doors,
      doorCount: opt.doorCount,
      partitionGvl: opt.partitionGvl,
      partitionSandwichLayered: opt.partitionSandwichLayered,
      partitionSandwichFactory: opt.partitionSandwichFactory,
      partitionOpeningsDoors: opt.partitionOpeningsDoors,
      partitionOpeningsGates: opt.partitionOpeningsGates,
      parapetLongSide: opt.parapetLongSide,
      parapetEnd: opt.parapetEnd,
      parapetOverhang: opt.parapetOverhang,
      floor: opt.floor,
      mezzanine1: opt.mezzanine1,
      mezzanine2: opt.mezzanine2,
      mezzanine3: opt.mezzanine3,
      stairType: opt.stairType,
      stairCount: opt.stairCount,
      fireResistance: opt.fireResistance,
      overheadCost: opt.overheadCostPercent / 100,
    }),
    [building, spanCount, perSpanWidth, roof, opt],
  );

  const [result, setResult] = useState(() => calculateProjectWork(inputs));
  useEffect(() => {
    setResult(calculateProjectWork(inputs));
  }, [inputs]);

  const area = building.span_m * building.length_m;

  return (
    <div>
      <h2 className="page-title">Проектные работы (Великан)</h2>
      <p className="text-muted text-small" style={{ marginTop: 0 }}>
        Стоимость и срок проектирования раздела КМ для ангара «Великан». Жёлтые поля 🔗 общие
        со зданием; остальные опции специфичны для проектных работ.
      </p>

      {/* ——— общие со зданием (жёлтые синхронизированные) ——— */}
      <fieldset style={{ marginBottom: 12 }}>
        <legend>Здание (синхронизировано со всеми вкладками)</legend>
        <div className="grid grid--4" style={{ gap: 10 }}>
          <SyncedNumField label="Ширина здания, м" value={building.span_m} onChange={(v) => setB("span_m", v)} validationKind="positive" />
          <SyncedNumField label="Длина, м" value={building.length_m} onChange={(v) => setB("length_m", v)} validationKind="positive" />
          <SyncedNumField label="Высота, м" value={building.height_m} onChange={(v) => setB("height_m", v)} validationKind="positive" />
          <SyncedNumField label="Шаг рам, м" value={building.framePitch_m} onChange={(v) => setB("framePitch_m", v)} validationKind="positive" />
          <SyncedSelectField
            label="Форма кровли"
            value={building.roofShape}
            options={[["gable", "Двускатная"], ["monoslope", "Односкатная"]]}
            onChange={(v) => setB("roofShape", v as Building["roofShape"])}
          />
          <SyncedSelectField
            label="Число пролётов"
            value={building.spanCount}
            options={[["single", "Один"], ["multi", "Более одного"]]}
            onChange={(v) => setB("spanCount", v as Building["spanCount"])}
          />
          <SyncedSelectField
            label="Сейсмичность, баллы"
            value={String(building.seismicPoints)}
            options={[["6", "до 6 — несейсм."], ["7", "7"], ["8", "8"], ["9", "9"]]}
            onChange={(v) => setB("seismicPoints", Number(v))}
          />
          <ReadOnly label="Опорный кран" value={building.hasCrane ? "есть (из здания)" : "нет"} />
          <ReadOnly label="Площадь застройки, м²" value={fmtNum(area)} />
        </div>
      </fieldset>

      {/* ——— проектные опции ——— */}
      <Collapsible title="🧱 Ограждающие конструкции" storageKey="pw-walls" defaultOpen>
        <div className="grid grid--3" style={{ gap: 10 }}>
          <Select label="Материал стен" value={String(opt.wallMaterial)}
            options={[["1", "профлист"], ["2", "сэндвич послойно"], ["3", "сэндвич заводской"]]}
            onChange={(v) => upd("wallMaterial", Number(v) as WallMaterial)} />
          <Num label="Толщина стен (индекс)" value={opt.wallThickness} onChange={(v) => upd("wallThickness", v)} />
          <Select label="Материал кровли" value={String(opt.roofingMaterial)}
            options={[["3", "профлист"], ["2", "послойная сборка"]]}
            onChange={(v) => upd("roofingMaterial", Number(v) as RoofingMaterial)} />
          <Check label="Снегозадержание" checked={opt.snowGuard} onChange={(v) => upd("snowGuard", v)} />
          <Check label="Ограждение кровли" checked={opt.roofFence} onChange={(v) => upd("roofFence", v)} />
          <Check label="Водосточная система" checked={opt.drainage} onChange={(v) => upd("drainage", v)} />
        </div>
      </Collapsible>

      <Collapsible title="🚪 Проёмы (окна, ворота, двери)" storageKey="pw-openings" defaultOpen>
        <div className="grid grid--3" style={{ gap: 10 }}>
          <Check label="Окна" checked={opt.windows} onChange={(v) => upd("windows", v)} />
          {opt.windows && <Num label="Количество окон" value={opt.windowCount} onChange={(v) => upd("windowCount", v)} />}
          <div />
          <Check label="Ворота" checked={opt.gates} onChange={(v) => upd("gates", v)} />
          {opt.gates && <Num label="Количество ворот" value={opt.gateCount} onChange={(v) => upd("gateCount", v)} />}
          {opt.gates && <Num label="Ворот на пролёт" value={opt.gateSpanCount} onChange={(v) => upd("gateSpanCount", v)} />}
          <Check label="Двери" checked={opt.doors} onChange={(v) => upd("doors", v)} />
          {opt.doors && <Num label="Количество дверей" value={opt.doorCount} onChange={(v) => upd("doorCount", v)} />}
        </div>
      </Collapsible>

      <Collapsible title="🧩 Перегородки" storageKey="pw-partitions" defaultOpen={false}>
        <div className="grid grid--3" style={{ gap: 10 }}>
          <Check label="ГВЛ" checked={opt.partitionGvl} onChange={(v) => upd("partitionGvl", v)} />
          <Check label="Сэндвич послойно" checked={opt.partitionSandwichLayered} onChange={(v) => upd("partitionSandwichLayered", v)} />
          <Check label="Сэндвич заводской" checked={opt.partitionSandwichFactory} onChange={(v) => upd("partitionSandwichFactory", v)} />
          <Check label="Проёмы: окна/двери" checked={opt.partitionOpeningsDoors} onChange={(v) => upd("partitionOpeningsDoors", v)} />
          <Check label="Проёмы: ворота" checked={opt.partitionOpeningsGates} onChange={(v) => upd("partitionOpeningsGates", v)} />
        </div>
      </Collapsible>

      <Collapsible title="📐 Парапет" storageKey="pw-parapet" defaultOpen={false}>
        <div className="grid grid--3" style={{ gap: 10 }}>
          <Select label="По продольной стороне" value={String(opt.parapetLongSide)} options={PARAPET_OPTIONS}
            onChange={(v) => upd("parapetLongSide", Number(v) as ParapetMode)} />
          <Select label="В торце" value={String(opt.parapetEnd)} options={PARAPET_OPTIONS}
            onChange={(v) => upd("parapetEnd", Number(v) as ParapetMode)} />
          <Check label="С выносом" checked={opt.parapetOverhang} onChange={(v) => upd("parapetOverhang", v)} />
        </div>
      </Collapsible>

      <Collapsible title="🏢 Перекрытие, антресоли, лестницы" storageKey="pw-floors" defaultOpen={false}>
        <div className="grid grid--3" style={{ gap: 10 }}>
          <Check label="Перекрытие" checked={opt.floor} onChange={(v) => upd("floor", v)} />
          <Check label="Антресоль 1" checked={opt.mezzanine1} onChange={(v) => upd("mezzanine1", v)} />
          <Check label="Антресоль 2" checked={opt.mezzanine2} onChange={(v) => upd("mezzanine2", v)} />
          <Check label="Антресоль 3" checked={opt.mezzanine3} onChange={(v) => upd("mezzanine3", v)} />
          <Select label="Лестница" value={opt.stairType} options={STAIR_OPTIONS}
            onChange={(v) => upd("stairType", v as StairType)} />
          {opt.stairType !== "none" && (
            <Num label="Количество лестниц" value={opt.stairCount} onChange={(v) => upd("stairCount", v)} />
          )}
        </div>
      </Collapsible>

      <Collapsible title="🏗 Краны и условия" storageKey="pw-cranes" defaultOpen={false}>
        <div className="grid grid--3" style={{ gap: 10 }}>
          {building.hasCrane && (
            <Num label="Г/п опорного крана (индекс)" value={opt.overheadCraneCapacity} onChange={(v) => upd("overheadCraneCapacity", v)} />
          )}
          <Check label="Подвесной кран" checked={opt.suspendedCrane} onChange={(v) => upd("suspendedCrane", v)} />
          {opt.suspendedCrane && (
            <Num label="Г/п подвесного (индекс)" value={opt.suspendedCraneCapacity} onChange={(v) => upd("suspendedCraneCapacity", v)} />
          )}
          <Num label="Степень огнестойкости" value={opt.fireResistance} onChange={(v) => upd("fireResistance", v)} />
          <Num label="Издержки, %" value={opt.overheadCostPercent} step={1} onChange={(v) => upd("overheadCostPercent", v)} />
        </div>
      </Collapsible>

      <fieldset style={{ marginTop: 12 }}>
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
  label, value, onChange, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Select({
  label, value, options, onChange,
}: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function Check({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
