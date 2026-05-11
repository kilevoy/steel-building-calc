import { useMemo, useState } from "react";
import {
  calculate,
  defaultInputs,
  floorTypes,
  maxSecondaryStepModes,
  structureTypes,
} from "./calc/beamCell/engine";
import type {
  CalculatorInputs,
  MemberSolution,
  Prices,
  Steel,
} from "./calc/beamCell/types";

const STEELS: readonly Steel[] = ["C245", "C345"];

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
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);
  const result = useMemo(() => calculate(inputs), [inputs]);
  const upd = <K extends keyof CalculatorInputs>(k: K, v: CalculatorInputs[K]) =>
    setInputs((cur) => ({ ...cur, [k]: v }));
  const updPrice = (k: keyof Prices, v: number) =>
    setInputs((cur) => ({ ...cur, prices: { ...cur.prices, [k]: v } }));

  const isRoofBeam = inputs.floorType === "балка покрытия";

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Балочная клетка</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {/* Column 1: Geometry */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <legend style={{ fontWeight: 600 }}>Геометрия</legend>
          <NumField label="Вдоль ГБ, м" value={inputs.lengthAlongMain} step={0.5} onChange={(v) => upd("lengthAlongMain", v)} />
          <NumField label="Поперёк ГБ, м" value={inputs.widthAcrossMain} step={0.5} onChange={(v) => upd("widthAcrossMain", v)} />
          <NumField label="Пролёт ГБ, м" value={inputs.mainBeamSpan} step={0.5} onChange={(v) => upd("mainBeamSpan", v)} />
          <NumField label="Шаг ГБ, м" value={inputs.mainBeamStep} step={0.5} onChange={(v) => upd("mainBeamStep", v)} />
          <NumField label="Высота колонны, м" value={inputs.columnHeight} step={0.5} onChange={(v) => upd("columnHeight", v)} />
          <SelField
            label="Конструкция перекрытия"
            value={inputs.floorType}
            options={floorTypes.map((t) => [t, t])}
            onChange={(v) => upd("floorType", v)}
          />
          <SelField
            label="Структура"
            value={inputs.structureType}
            options={structureTypes.map((t) => [t, t])}
            onChange={(v) => upd("structureType", v)}
          />
        </fieldset>

        {/* Column 2: Loads & step */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <legend style={{ fontWeight: 600 }}>Нагрузка и шаг ВБ</legend>
          <NumField
            label="Нагрузка, кг/м²"
            value={inputs.floorLoadKgM2}
            step={5}
            onChange={(v) => upd("floorLoadKgM2", v)}
          />
          <SelField
            label="Макс. шаг ВБ"
            value={inputs.maxSecondaryStepMode}
            options={maxSecondaryStepModes.map((m) => [m, m === "по умолчанию" ? "по умолчанию (1000 мм)" : `${m} мм`])}
            onChange={(v) => upd("maxSecondaryStepMode", v)}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 8, lineHeight: 1.4 }}>
            <div>q ГБ = <b>{fmtN(result.qMain)} кН/м²</b></div>
            {result.qSecondary !== undefined && <div>q ВБ = <b>{fmtN(result.qSecondary)} кН/м²</b></div>}
            {result.columnLoadKn !== undefined && (
              <div>N на колонну = <b>{fmtN(result.columnLoadKn, 1)} кН</b></div>
            )}
            {isRoofBeam && (
              <div style={{ marginTop: 6, color: "#a16207" }}>
                Тип «балка покрытия» — считается только ГБ (без ВБ и колонн).
              </div>
            )}
          </div>
        </fieldset>

        {/* Column 3: Prices + Steels */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <legend style={{ fontWeight: 600 }}>Сталь и цены (руб/кг)</legend>
          <SelField
            label="Сталь ВБ (учитывать)"
            value={inputs.acceptedSecondarySteel}
            options={STEELS.map((s) => [s, s])}
            onChange={(v) => upd("acceptedSecondarySteel", v as Steel)}
          />
          <SelField
            label="Сталь ГБ (учитывать)"
            value={inputs.acceptedMainSteel}
            options={STEELS.map((s) => [s, s])}
            onChange={(v) => upd("acceptedMainSteel", v as Steel)}
          />
          <SelField
            label="Сталь колонн (учитывать)"
            value={inputs.acceptedColumnSteel}
            options={STEELS.map((s) => [s, s])}
            onChange={(v) => upd("acceptedColumnSteel", v as Steel)}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
            <NumField label="Двутавр С245" value={inputs.prices.ibeamC245} step={0.5} onChange={(v) => updPrice("ibeamC245", v)} />
            <NumField label="Двутавр С345" value={inputs.prices.ibeamC345} step={0.5} onChange={(v) => updPrice("ibeamC345", v)} />
            <NumField label="Труба С245" value={inputs.prices.tubeC245} step={0.5} onChange={(v) => updPrice("tubeC245", v)} />
            <NumField label="Труба С345" value={inputs.prices.tubeC345} step={0.5} onChange={(v) => updPrice("tubeC345", v)} />
            <NumField label="Швеллер С245" value={inputs.prices.channelC245} step={0.5} onChange={(v) => updPrice("channelC245", v)} />
            <NumField label="Швеллер С345" value={inputs.prices.channelC345} step={0.5} onChange={(v) => updPrice("channelC345", v)} />
          </div>
        </fieldset>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3 style={{ marginTop: 0 }}>Результаты подбора</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <ResultTable title="Второстепенная балка (ВБ)" rows={[result.secondary.C245, result.secondary.C345]} accepted={inputs.acceptedSecondarySteel} />
        <ResultTable title="Главная балка (ГБ)" rows={[result.main.C245, result.main.C345]} accepted={inputs.acceptedMainSteel} showCost />
        <ResultTable title="Колонна" rows={[result.columns.C245, result.columns.C345]} accepted={inputs.acceptedColumnSteel} showCost />
      </div>

      <fieldset style={{ marginTop: 20, border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
        <legend style={{ fontWeight: 600 }}>Итого по балочной клетке</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <Stat label="Без колонн, масса" value={fmtKg(result.totals.withoutColumnsKg)} />
          <Stat label="Без колонн, стоимость" value={fmtRub(result.totals.withoutColumnsCostRub)} />
          <Stat label="С колоннами, масса" value={fmtKg(result.totals.withColumnsKg)} />
          <Stat label="С колоннами, стоимость" value={fmtRub(result.totals.withColumnsCostRub)} />
        </div>
        {result.warnings.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#a16207" }}>
            {result.warnings.map((w, i) => (
              <div key={i}>⚠ {w}</div>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #e2e8f0",
  textAlign: "left",
  whiteSpace: "nowrap",
  background: "#f8fafc",
  fontSize: 12,
};
const td: React.CSSProperties = {
  padding: "4px 8px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 13,
};

function ResultTable({
  title,
  rows,
  accepted,
  showCost = true,
}: {
  title: string;
  rows: MemberSolution[];
  accepted: Steel;
  showCost?: boolean;
}) {
  return (
    <div>
      <h4 style={{ margin: "0 0 6px 0", fontSize: 14 }}>{title}</h4>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={th}>Сталь</th>
            <th style={th}>Профиль</th>
            <th style={th}>Шаг</th>
            <th style={th}>Масса</th>
            {showCost && <th style={th}>Стоимость</th>}
            <th style={th}>K</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isAccepted = r.material === accepted;
            return (
              <tr key={r.material} style={isAccepted ? { background: "#fffbeb" } : undefined}>
                <td style={td}>
                  <b>{r.material}</b>
                  {isAccepted ? " ★" : ""}
                </td>
                <td style={td}>{solutionText(r)}</td>
                <td style={td}>{r.stepMm ? `${r.stepMm} мм` : "—"}</td>
                <td style={td}>{fmtKg(r.weightKg)}</td>
                {showCost && <td style={td}>{fmtRub(r.costRub)}</td>}
                <td style={td}>{r.utilization === undefined ? "—" : r.utilization.toFixed(3)}</td>
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
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, display: "block" }}>{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", padding: 4, boxSizing: "border-box" }}
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
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, display: "block" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: 4, boxSizing: "border-box" }}
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
      <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
