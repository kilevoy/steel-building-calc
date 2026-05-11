import { useMemo } from "react";
import { useBuilding } from "./building/context";
import {
  useBuildingResults,
  type BuildingResults,
  type ResultItem,
} from "./building/results";

function fmtKg(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(2)} т`;
  return `${v.toFixed(1)} кг`;
}
function fmtRub(v: number): string {
  if (!Number.isFinite(v) || v === 0) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} млн ₽`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)} тыс. ₽`;
  return `${v.toFixed(0)} ₽`;
}

interface Row {
  label: string;
  profile: string;
  steel: string;
  count: string;
  unitMass_kg: string;
  totalMass_kg: number;
  cost_rub: number;
  note?: string;
}

function rowFromItem(label: string, item: ResultItem | null, note?: string): Row | null {
  if (!item) return null;
  const count = item.count ?? 1;
  const unit = item.massPerPiece_kg ?? item.totalMass_kg / Math.max(1, count);
  return {
    label,
    profile: item.profile,
    steel: item.steel,
    count: count > 1 ? `${count}` : "—",
    unitMass_kg: count > 1 ? fmtKg(unit) : "—",
    totalMass_kg: item.totalMass_kg,
    cost_rub: item.cost_rub,
    note,
  };
}

function buildRows(r: BuildingResults): Row[] {
  const rows: Row[] = [];

  // Columns: edge/middle/fachwerk separate rows
  if (r.column) {
    const edge = rowFromItem("Колонна крайняя", r.column.edge);
    if (edge) rows.push(edge);
    const mid = rowFromItem("Колонна средняя", r.column.middle);
    if (mid) rows.push(mid);
    const fw = rowFromItem("Колонна фахверк", r.column.fachwerk);
    if (fw) rows.push(fw);
  }

  // Truss: aggregated row with per-section breakdown footer
  if (r.truss) {
    rows.push({
      label: "Ферма покрытия",
      profile: r.truss.sections.map((s) => `${s.section}: ${s.profile}`).join(" / "),
      steel: r.truss.sections[0]?.steel ?? "—",
      count: `${r.truss.n_trusses}`,
      unitMass_kg: fmtKg(r.truss.totalMass_kg / r.truss.n_trusses),
      totalMass_kg: r.truss.totalMass_kg,
      cost_rub: r.truss.totalCost_rub,
      note: `${r.truss.unitMass_kg_per_m2.toFixed(1)} кг/м²`,
    });
  }

  // Other elements
  const purlin = rowFromItem("Прогоны (ЛСТК)", r.purlin);
  if (purlin) rows.push(purlin);

  const beamCell = rowFromItem("Балка покрытия", r.beamCell);
  if (beamCell) rows.push(beamCell);

  const windowRiegel = rowFromItem(
    "Оконные ригели (★ top‑1)",
    r.windowRiegel,
    "Масса 1 ригеля; кол-во не учитывается",
  );
  if (windowRiegel) rows.push(windowRiegel);

  const craneBeam = rowFromItem(
    "Подкрановая балка",
    r.craneBeam,
    "Масса 1 балки; кол-во не учитывается",
  );
  if (craneBeam) rows.push(craneBeam);

  return rows;
}

interface SteelTotal {
  steel: string;
  mass_kg: number;
  cost_rub: number;
}

function aggregateBySteel(rows: Row[]): SteelTotal[] {
  const map = new Map<string, SteelTotal>();
  for (const r of rows) {
    if (!r.steel || r.steel === "—") continue;
    const cur = map.get(r.steel) ?? { steel: r.steel, mass_kg: 0, cost_rub: 0 };
    cur.mass_kg += r.totalMass_kg;
    cur.cost_rub += r.cost_rub;
    map.set(r.steel, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.mass_kg - a.mass_kg);
}

const th: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "2px solid #cbd5e1",
  background: "#f1f5f9",
  textAlign: "left",
  fontSize: 12,
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 10px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 13,
  whiteSpace: "nowrap",
};
const tdR: React.CSSProperties = { ...td, textAlign: "right" };

export function SummaryApp() {
  const { building } = useBuilding();
  const { results } = useBuildingResults();
  const rows = useMemo(() => buildRows(results), [results]);
  const bySteel = useMemo(() => aggregateBySteel(rows), [rows]);
  const totalMass = rows.reduce((s, r) => s + r.totalMass_kg, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost_rub, 0);

  if (rows.length === 0) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Сводка по зданию</h2>
        <p style={{ color: "#666" }}>
          Пока нет рассчитанных элементов. Нажмите «Рассчитать» в одной из вкладок,
          и результат сразу появится здесь.
        </p>
        <BuildingBlock />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Сводка по зданию</h2>
      <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
        Подобранные профили и металлоёмкость из всех вкладок одновременно. Все данные
        автоматически обновляются при изменении исходных параметров.
      </p>

      <BuildingBlock />

      <h3 style={{ marginBottom: 6 }}>Подобранные элементы</h3>
      <div style={{ overflow: "auto", marginBottom: 24 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Элемент</th>
              <th style={th}>Профиль</th>
              <th style={th}>Сталь</th>
              <th style={{ ...th, textAlign: "right" }}>Шт.</th>
              <th style={{ ...th, textAlign: "right" }}>Масса 1 шт.</th>
              <th style={{ ...th, textAlign: "right" }}>Σ масса</th>
              <th style={{ ...th, textAlign: "right" }}>Σ стоимость</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontWeight: 600 }}>{r.label}</td>
                <td style={td}>
                  {r.profile}
                  {r.note && (
                    <span style={{ color: "#a16207", fontSize: 11, marginLeft: 6 }}>
                      ({r.note})
                    </span>
                  )}
                </td>
                <td style={td}>{r.steel}</td>
                <td style={tdR}>{r.count}</td>
                <td style={tdR}>{r.unitMass_kg}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{fmtKg(r.totalMass_kg)}</td>
                <td style={tdR}>{fmtRub(r.cost_rub)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f8fafc" }}>
              <td style={{ ...td, fontWeight: 700 }} colSpan={5}>Итого по зданию</td>
              <td style={{ ...tdR, fontWeight: 700 }}>{fmtKg(totalMass)}</td>
              <td style={{ ...tdR, fontWeight: 700 }}>{fmtRub(totalCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {bySteel.length > 0 && (
        <>
          <h3 style={{ marginBottom: 6 }}>Расход стали по маркам</h3>
          <div style={{ overflow: "auto", marginBottom: 24 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 700 }}>
              <thead>
                <tr>
                  <th style={th}>Марка стали</th>
                  <th style={{ ...th, textAlign: "right" }}>Σ масса</th>
                  <th style={{ ...th, textAlign: "right" }}>Σ стоимость</th>
                </tr>
              </thead>
              <tbody>
                {bySteel.map((s) => (
                  <tr key={s.steel}>
                    <td style={{ ...td, fontWeight: 600 }}>{s.steel}</td>
                    <td style={tdR}>{fmtKg(s.mass_kg)}</td>
                    <td style={tdR}>{fmtRub(s.cost_rub)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Truss section breakdown — separate small table if truss is present */}
      {results.truss && results.truss.sections.length > 0 && (
        <>
          <h3 style={{ marginBottom: 6 }}>Ферма — разбивка по элементам</h3>
          <div style={{ overflow: "auto", marginBottom: 24 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 700 }}>
              <thead>
                <tr>
                  <th style={th}>Элемент</th>
                  <th style={th}>Профиль</th>
                  <th style={th}>Сталь</th>
                  <th style={{ ...th, textAlign: "right" }}>Σ масса</th>
                </tr>
              </thead>
              <tbody>
                {results.truss.sections.map((s, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600 }}>{s.section}</td>
                    <td style={td}>{s.profile}</td>
                    <td style={td}>{s.steel}</td>
                    <td style={tdR}>{fmtKg(s.totalMass_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <details style={{ marginTop: 16, fontSize: 12, color: "#475569" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Примечания к сводке</summary>
        <ul style={{ marginTop: 8 }}>
          <li>Цены оконных ригелей и подкрановой балки пока не включены в синхронизированный
              блок «Цены стали» — для них стоимость показана как 0.</li>
          <li>Для оконных ригелей и подкрановой балки масса учтена как «1 элемент» —
              реальное количество зависит от компоновки и считается отдельно.</li>
          <li>Количество элементов (фермы / колонны / балки покрытия) определяется
              автоматически из длины здания и шага рам.</li>
        </ul>
        <div style={{ marginTop: 8 }}>
          Длина здания: <b>{building.length_m} м</b> · шаг рам: <b>{building.framePitch_m} м</b>{" "}
          → <b>{Math.max(2, Math.floor(building.length_m / building.framePitch_m) + 1)}</b> рам/ферм/балок покрытия.
        </div>
      </details>
    </div>
  );
}

function BuildingBlock() {
  const { building } = useBuilding();
  const area_m2 = building.span_m * building.length_m;
  return (
    <fieldset
      style={{
        border: "1px solid #cbd5e1",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "#f8fafc",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Исходные данные</legend>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 13 }}>
        {building.city && <div>Город: <b>{building.city}</b></div>}
        <div>Пролёт: <b>{building.span_m} м</b></div>
        <div>Длина: <b>{building.length_m} м</b></div>
        <div>Высота: <b>{building.height_m} м</b></div>
        <div>Уклон: <b>{building.roofSlope_deg}°</b></div>
        <div>Шаг рам: <b>{building.framePitch_m} м</b></div>
        <div>Площадь застройки: <b>{area_m2.toFixed(0)} м²</b></div>
        <div>w₀: <b>{building.w0_kPa} кПа</b></div>
        <div>Sg: <b>{building.Sg_kPa} кПа</b></div>
        <div>Местн.: <b>{building.terrainType}</b></div>
        <div>Покр.: <b>{building.roofStructure}</b></div>
        <div>γₙ: <b>{building.responsibilityCoeff}</b></div>
      </div>
    </fieldset>
  );
}
