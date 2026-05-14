import { Stat } from "../components/form";
import type { CalculationOutput, ColumnType } from "../calc/types";

const TD: React.CSSProperties = { padding: "3px 6px", whiteSpace: "nowrap" };

const TABLE_HEADERS = [
  "№",
  "Профиль",
  "Сталь",
  "Распорки",
  "К-т исп",
  "ПС",
  "по σ",
  "по σ уст X",
  "по σ уст Y",
  "по гибк X",
  "по гибк Y",
  "Масса 1 п.м, кг",
  "Масса колонны, кг",
  "Масса с расп., кг",
  "Стоимость, т.р.",
] as const;

/**
 * Renders the column-type tab bar, the stat row for the selected tab,
 * and the table of viable profiles. Pure component — receives the full
 * results map and the active tab from the parent.
 */
export function ResultsView({
  results,
  activeTab,
  setActiveTab,
  columnTypes,
  columnLabels,
}: {
  results: Record<ColumnType, CalculationOutput>;
  activeTab: ColumnType;
  setActiveTab: (ct: ColumnType) => void;
  columnTypes: readonly ColumnType[];
  columnLabels: Record<ColumnType, string>;
}) {
  const result = results[activeTab];
  return (
    <>
      <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "2px solid #cbd5e1" }}>
        {columnTypes.map((ct) => {
          const isActive = activeTab === ct;
          const r = results[ct];
          const top = r.results[0];
          return (
            <button
              key={ct}
              onClick={() => setActiveTab(ct)}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "#2563eb" : "#f1f5f9",
                color: isActive ? "#fff" : "#334155",
                border: "none",
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                cursor: "pointer",
                minWidth: 200,
                textAlign: "left",
              }}
            >
              <div>{columnLabels[ct]}</div>
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                N={r.N_kN.toFixed(1)} кН · M={r.M_kNm.toFixed(1)} кН·м
              </div>
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
                {top
                  ? `топ: ${top.profileName} / ${top.steel} / ${top.struts} расп. (${top.maxUtilization.toFixed(2)})`
                  : "нет подходящих"}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
        <Stat label="N (осевая)" value={`${result.N_kN.toFixed(1)} кН`} />
        <Stat label="M (момент)" value={`${result.M_kNm.toFixed(1)} кН·м`} />
        <Stat label="μ" value={result.mu.toFixed(2)} />
        <Stat label="Снег расч." value={`${result.snowLoad_kPa.toFixed(3)} кПа`} />
        <Stat label="Ветер давл." value={`${result.windPressure_kPa.toFixed(3)} кПа`} />
        <Stat label="Ветер отс." value={`${result.windSuction_kPa.toFixed(3)} кПа`} />
        <Stat label="Sверт" value={`${result.tributaryArea_m2.toFixed(1)} м²`} />
        <Stat label="Sстен" value={`${result.wallArea_m2.toFixed(1)} м²`} />
      </div>

      <h2 style={{ fontSize: 16 }}>
        {columnLabels[activeTab]} — подходящие профили ({result.results.length} из 2080 вариантов)
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "4px 6px",
                    borderBottom: "2px solid #94a3b8",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.results.map((r) => (
              <tr
                key={`${r.profileName}-${r.steel}-${r.struts}`}
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  background: r.maxUtilization > 0.95 ? "#fef2f2" : undefined,
                }}
              >
                <td style={TD}>{r.rank}</td>
                <td style={{ ...TD, fontWeight: 600 }}>{r.profileName}</td>
                <td style={TD}>{r.steel}</td>
                <td style={TD}>{r.struts}</td>
                <td style={{ ...TD, fontWeight: 600 }}>{r.maxUtilization.toFixed(3)}</td>
                <td style={TD}>{r.limitingCheck}</td>
                <td style={TD}>{r.utilizationSigma.toFixed(3)}</td>
                <td style={TD}>{r.utilizationStabX.toFixed(3)}</td>
                <td style={TD}>{r.utilizationStabY.toFixed(3)}</td>
                <td style={TD}>{r.utilizationSlendX.toFixed(3)}</td>
                <td style={TD}>{r.utilizationSlendY.toFixed(3)}</td>
                <td style={TD}>{r.mass_per_m.toFixed(1)}</td>
                <td style={TD}>{r.columnMass_kg.toFixed(1)}</td>
                <td style={TD}>{r.totalMass_kg.toFixed(1)}</td>
                <td style={TD}>{r.cost_rub.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
