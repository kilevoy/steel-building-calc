import { useEffect } from "react";
import { PricesBlock } from "./building/PricesBlock";
import { Collapsible } from "./building/Collapsible";
import { useBuilding } from "./building/useBuilding";
import { useCraneBeamRunner } from "./building/useCraneBeamRunner";
import { craneOptions } from "./calc/craneBeam/engine";
import type { CraneCheckValue } from "./calc/craneBeam/types";

function fmt(n: number | string | null | undefined, digits = 3): string {
  if (n === null || n === undefined) return "—";
  if (typeof n === "number") return Number.isFinite(n) ? n.toFixed(digits) : "—";
  return String(n);
}

function fmtN(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function CraneBeamApp() {
  const { building } = useBuilding();
  const {
    inputs,
    upd,
    result,
    calculating,
    error,
    setAutoRecalc,
  } = useCraneBeamRunner();

  // Вкладка считается автоматически: после кэширования HyperFormula-книги
  // повторный расчёт стоит ~60 мс, ручная кнопка «Рассчитать» не нужна.
  // Флаг остаётся включённым и после ухода с вкладки, чтобы результат
  // обновлялся при изменении общих параметров здания.
  useEffect(() => {
    setAutoRecalc(true);
  }, [setAutoRecalc]);

  return (
    <div>
      <h2 className="page-title">Подкрановая балка</h2>
      <p className="text-muted text-small" style={{ marginTop: 0 }}>
        Расчёт по СП 16.13330 + СП 35.13330. Подбор сечения, проверка прочности / общей и местной
        устойчивости / усталости (7К–8К) / прогибов. Пересчитывается автоматически при изменении
        параметров.
      </p>

      <div style={{ marginBottom: 16 }}>
       <Collapsible title="📥 Исходные данные" storageKey="cranebeam-inputs" defaultOpen={true}>
      <div className="grid grid--3" style={{ gap: 12 }}>
        {/* Column 1: Crane */}
        <fieldset>
          <legend style={{ fontWeight: 600 }}>Кран</legend>
          <SelField
            label="Грузоподъёмность, т"
            value={String(inputs.capacity)}
            options={craneOptions.capacities.map((c) => [String(c), String(c)])}
            onChange={(v) => upd("capacity", isFinite(Number(v)) ? Number(v) : v)}
          />
          <SelField
            label="Пролёт крана, м"
            value={String(inputs.craneSpan)}
            options={craneOptions.craneSpans.map((c) => [String(c), `${c} м`])}
            onChange={(v) => upd("craneSpan", Number(v))}
          />
          <NumField label="Число колёс одной стороны" value={inputs.wheelCount} step={1} onChange={(v) => upd("wheelCount", v)} />
          <SelField
            label="Тип подвеса"
            value={String(inputs.suspensionType)}
            options={craneOptions.suspensionTypes.map((t) => [String(t), String(t)])}
            onChange={(v) => upd("suspensionType", v)}
          />
          <SelField
            label="Группа режима работы"
            value={String(inputs.workGroup)}
            options={craneOptions.workGroups.map((g) => [String(g), String(g)])}
            onChange={(v) => upd("workGroup", v)}
          />
          <SelField
            label="Число кранов в пролёте"
            value={String(inputs.craneCount)}
            options={craneOptions.craneCounts.map((c) => [String(c), String(c)])}
            onChange={(v) => upd("craneCount", v)}
          />
          <SelField
            label="Рельс"
            value={String(inputs.rail)}
            options={craneOptions.rails.map((r) => [String(r), String(r)])}
            onChange={(v) => upd("rail", v)}
          />
        </fieldset>

        {/* Column 2: Beam geometry */}
        <fieldset>
          <legend style={{ fontWeight: 600 }}>Балка</legend>
          <NumField label="Пролёт балки, м" value={inputs.beamSpan} step={0.5} onChange={(v) => upd("beamSpan", v)} />
          <SelField
            label="Тормозная конструкция"
            value={String(inputs.brakeStructure)}
            options={craneOptions.brakeStructures.map((b) => [String(b), String(b)])}
            onChange={(v) => upd("brakeStructure", v)}
          />
          <NumField label="Шаг рёбер, м (0 = авто)" value={inputs.ribStep} step={0.1} onChange={(v) => upd("ribStep", v)} />
          <SelField
            label="Расчёт на усталость"
            value={String(inputs.fatigueCalculation)}
            options={craneOptions.fatigueOptions.map((f) => [String(f), String(f)])}
            onChange={(v) => upd("fatigueCalculation", v)}
          />
        </fieldset>

        {/* Column 3: Factors */}
        <fieldset>
          <legend style={{ fontWeight: 600 }}>Коэффициенты</legend>
          <NumField label="γf (нагрузка)" value={inputs.gammaF} step={0.05} onChange={(v) => upd("gammaF", v)} />
          <NumField label="γd (динамика)" value={inputs.gammaDynamic} step={0.05} onChange={(v) => upd("gammaDynamic", v)} />
          <NumField label="γc (условия работы)" value={inputs.gammaC} step={0.05} onChange={(v) => upd("gammaC", v)} />
          <NumField label="kсв (учёт собств.массы)" value={inputs.selfWeightFactor} step={0.01} onChange={(v) => upd("selfWeightFactor", v)} />
          <div className="text-small text-muted" style={{ marginTop: 12 }}>
            {calculating
              ? "⏳ Пересчёт..."
              : "Считается автоматически при изменении параметров."}
          </div>
        </fieldset>
      </div>
       </Collapsible>
      </div>

      <div style={{ marginTop: 12 }}>
        <PricesBlock />
      </div>

      {!building.hasCrane ? (
        <div className="note note--info" style={{ marginTop: 12 }}>
          Кран не включён. Включите опорный или подвесной кран на вкладке
          «Колонна» — подкрановая балка рассчитается автоматически.
        </div>
      ) : (
        error && (
          <div className="note note--danger" style={{ marginTop: 12 }}>
            Ошибка: {error}
          </div>
        )
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <fieldset>
            <legend style={{ fontWeight: 600 }}>Подобранное сечение</legend>
            <div className="grid grid--4" style={{ gap: 12 }}>
              <Stat label="Профиль" value={result.profile ?? "—"} />
              <Stat label="K (Iпр+IIпр), %" value={fmtN(result.utilizationPercent, 2)} />
              <Stat label="Масса, кг" value={fmtN(result.weightKg, 1)} />
              <Stat label="Шаг рёбер, м" value={fmtN(result.ribStepSelectedM, 2)} />
            </div>
            <div className="grid grid--6" style={{ gap: 12, marginTop: 12 }}>
              <Stat label="Нагрузка от колеса, кН" value={fmtN(result.wheelLoadKn, 2)} />
              <Stat label="Масса тележки, т" value={fmtN(result.trolleyMassT, 2)} />
              <Stat label="База крана, мм" value={fmtN(result.craneBaseMm, 0)} />
              <Stat label="Колея крана, мм" value={fmtN(result.craneGaugeMm, 0)} />
              <Stat label="Ширина подошвы рельса, м" value={fmtN(result.railFootWidthM, 3)} />
              <Stat label="Высота рельса, м" value={fmtN(result.railHeightM, 3)} />
            </div>
          </fieldset>

          <div className="grid grid--2" style={{ gap: 12, marginTop: 12 }}>
            <CheckTable title="Размеры профиля" rows={result.dimensions} />
            <CheckTable title="Прочность" rows={result.strength} />
            <CheckTable title="Геометрические характеристики" rows={result.geometry} />
            <CheckTable title="Общая устойчивость" rows={result.globalStability} />
            <CheckTable title="Усталость и проверки 7К–8К" rows={result.crane78} />
            <CheckTable title="Местная устойчивость стенки" rows={result.localStability} />
            <CheckTable title="Прогибы (II пр. сост.)" rows={result.deflections} />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckTable({ title, rows }: { title: string; rows: CraneCheckValue[] }) {
  return (
    <div>
      <h4 className="section-title" style={{ fontSize: 14 }}>{title}</h4>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Параметр</th>
              <th className="num">Значение</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.label}</td>
                <td className="num" style={{ fontFamily: "monospace" }}>
                  {typeof r.value === "number" ? fmt(r.value, 4) : (r.value ?? "—")}
                </td>
              </tr>
            ))}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  );
}
