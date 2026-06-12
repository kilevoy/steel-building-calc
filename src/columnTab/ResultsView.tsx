import { Stat } from "../components/form";
import type { CalculationOutput, ColumnType } from "../calc/types";

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
      <div className="tabs">
        {columnTypes.map((ct) => {
          const isActive = activeTab === ct;
          const r = results[ct];
          const top = r.results[0];
          return (
            <button
              key={ct}
              onClick={() => setActiveTab(ct)}
              className={isActive ? "tab tab--active" : "tab"}
              style={{ minWidth: 200, textAlign: "left" }}
            >
              <div>{columnLabels[ct]}</div>
              <div className="text-small" style={{ fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                N={r.N_kN.toFixed(1)} кН · M={r.M_kNm.toFixed(1)} кН·м
              </div>
              <div className="text-small" style={{ fontWeight: 400, opacity: 0.85 }}>
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

      <h2 className="section-title">
        {columnLabels[activeTab]} — подходящие профили ({result.results.length} из 2080 вариантов)
      </h2>
      <div className="table-wrap">
        <table className="table text-small">
          <thead>
            <tr>
              {TABLE_HEADERS.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.results.map((r) => (
              <tr
                key={`${r.profileName}-${r.steel}-${r.struts}`}
                style={{ background: r.maxUtilization > 0.95 ? "#fef2f2" : undefined }}
              >
                <td className="num">{r.rank}</td>
                <td style={{ fontWeight: 600 }}>{r.profileName}</td>
                <td>{r.steel}</td>
                <td className="num">{r.struts}</td>
                <td className="num" style={{ fontWeight: 600 }}>{r.maxUtilization.toFixed(3)}</td>
                <td>{r.limitingCheck}</td>
                <td className="num">{r.utilizationSigma.toFixed(3)}</td>
                <td className="num">{r.utilizationStabX.toFixed(3)}</td>
                <td className="num">{r.utilizationStabY.toFixed(3)}</td>
                <td className="num">{r.utilizationSlendX.toFixed(3)}</td>
                <td className="num">{r.utilizationSlendY.toFixed(3)}</td>
                <td className="num">{r.mass_per_m.toFixed(1)}</td>
                <td className="num">{r.columnMass_kg.toFixed(1)}</td>
                <td className="num">{r.totalMass_kg.toFixed(1)}</td>
                <td className="num">{r.cost_rub.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
