import { useMemo } from "react";
import {
  deriveUnifiedBuildingLayoutFromBuilding,
  deriveUnifiedBuildingLayoutInput,
} from "./building/unifiedBuildingInput";
import { useBuilding } from "./building/useBuilding";
import { useBuildingResults } from "./building/useBuildingResults";
import { useCraneBeamRunner } from "./building/useCraneBeamRunner";
import type { BuildingResults } from "./building/resultsContext";
import {
  buildSummaryRows,
  formatSummaryCost,
  formatSummaryMass,
} from "./building/summaryRows";
import {
  calculateBuildingSummaryTotals,
  calculateBuildingSummaryTotalsBySteel,
} from "./building/summaryTotals";
import { applyAutoPurlinResult } from "./building/autoPurlinResult";
import { buildColumnCountSummary } from "./building/columnCountSummary";
import { buildPurlinBuildingSummary } from "./building/purlinSummary";
import {
  getAvailablePurlinSelectionModes,
  getPurlinSelectionWarning,
  purlinContinuitySchemeLabel,
  purlinSelectionModeLabel,
} from "./building/purlinSelection";

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
  const summaryResults = useMemo(
    () => applyAutoPurlinResult(results, building),
    [results, building],
  );
  const rows = useMemo(() => buildSummaryRows(summaryResults), [summaryResults]);
  const bySteel = useMemo(() => calculateBuildingSummaryTotalsBySteel(summaryResults), [summaryResults]);
  const totals = useMemo(() => calculateBuildingSummaryTotals(summaryResults), [summaryResults]);
  const purlinWarning = getPurlinSelectionWarning(
    building.purlinSelectionMode,
    building,
    summaryResults.purlin,
  );

  if (rows.length === 0) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Сводка по зданию</h2>
        <p style={{ color: "#666" }}>
          Пока нет рассчитанных элементов. Нажмите «Рассчитать» в одной из вкладок,
          и результат сразу появится здесь.
        </p>
        <BuildingBlock />
        <PurlinSelectionWarning warning={purlinWarning} />
        <ColumnCountSummaryBlock results={summaryResults} />
        <PurlinBuildingSummaryBlock results={summaryResults} />
        <BuildingCountDiagnostics />
        <CraneBeamTrigger />
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
      <PurlinSelectionWarning warning={purlinWarning} />
      <ColumnCountSummaryBlock results={summaryResults} />
      <PurlinBuildingSummaryBlock results={summaryResults} />
      <BuildingCountDiagnostics />
      <CraneBeamTrigger />
      <IncompleteQuantityWarning
        hasWindowRiegel={!!summaryResults.windowRiegel}
      />

      <h3 style={{ marginBottom: 6 }}>Подобранные элементы</h3>
      <div style={{ overflow: "auto", marginBottom: 24 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Элемент</th>
              <th style={th}>Профиль</th>
              <th style={th}>Детали</th>
              <th style={th}>Сталь</th>
              <th style={{ ...th, textAlign: "right" }}>Шт.</th>
              <th style={{ ...th, textAlign: "right" }}>Длина 1 шт.</th>
              <th style={{ ...th, textAlign: "right" }}>Σ длина</th>
              <th style={{ ...th, textAlign: "right" }}>Масса 1 шт.</th>
              <th style={{ ...th, textAlign: "right" }}>Σ масса</th>
              <th style={{ ...th, textAlign: "right" }}>Σ стоимость</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontWeight: 600 }}>{r.label}</td>
                <td style={td}>{r.profile}</td>
                <td style={td}>{r.details ?? "—"}</td>
                <td style={td}>{r.steel}</td>
                <td style={tdR}>{r.count}</td>
                <td style={tdR}>{r.lengthPerPiece_m}</td>
                <td style={tdR}>{r.totalLength_m}</td>
                <td style={tdR}>{r.unitMass_kg}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{formatSummaryMass(r.totalMass_kg)}</td>
                <td style={tdR}>{formatSummaryCost(r.cost_rub)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f8fafc" }}>
              <td style={{ ...td, fontWeight: 700 }} colSpan={8}>Итого по зданию</td>
              <td style={{ ...tdR, fontWeight: 700 }}>{formatSummaryMass(totals.totalMass_kg)}</td>
              <td style={{ ...tdR, fontWeight: 700 }}>{formatSummaryCost(totals.totalCost_rub)}</td>
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
                    <td style={tdR}>{formatSummaryMass(s.totalMass_kg)}</td>
                    <td style={tdR}>{formatSummaryCost(s.totalCost_rub)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Truss section breakdown — separate small table if truss is present */}
      {summaryResults.truss && summaryResults.truss.sections.length > 0 && (
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
                {summaryResults.truss.sections.map((s, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600 }}>{s.section}</td>
                    <td style={td}>{s.profile}</td>
                    <td style={td}>{s.steel}</td>
                    <td style={tdR}>{formatSummaryMass(s.totalMass_kg)}</td>
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
          <li>Количество оконных ригелей задаётся вручную на вкладке «Оконные ригели»
              до появления отдельной модели фасадов.</li>
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
  const { building, setBuilding } = useBuilding();
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
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Прогоны</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Тип:
              <select
                value={building.purlinSelectionMode}
                onChange={(event) =>
                  setBuilding({
                    purlinSelectionMode: event.target.value as typeof building.purlinSelectionMode,
                  })
                }
                style={{ minWidth: 150 }}
              >
                {getAvailablePurlinSelectionModes(building).map((mode) => (
                  <option key={mode} value={mode}>
                    {purlinSelectionModeLabel(mode)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Схема:
              <select
                value={building.purlinContinuityScheme}
                onChange={(event) =>
                  setBuilding({
                    purlinContinuityScheme: event.target.value as typeof building.purlinContinuityScheme,
                  })
                }
                style={{ minWidth: 130 }}
              >
                <option value="split">{purlinContinuitySchemeLabel("split")}</option>
                <option value="continuous">{purlinContinuitySchemeLabel("continuous")}</option>
              </select>
            </label>
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
            Принятый расчетчиком вариант прогонов для итоговой сводки.
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function PurlinSelectionWarning({ warning }: { warning: string | null }) {
  if (!warning) return null;

  return (
    <div
      style={{
        border: "1px solid #f59e0b",
        background: "#fffbeb",
        color: "#92400e",
        borderRadius: 6,
        padding: "8px 10px",
        marginBottom: 16,
        fontSize: 13,
      }}
    >
      {warning}
    </div>
  );
}

function IncompleteQuantityWarning({
  hasWindowRiegel,
}: {
  hasWindowRiegel: boolean;
}) {
  if (!hasWindowRiegel) return null;

  return (
    <div
      style={{
        border: "1px solid #f59e0b",
        background: "#fffbeb",
        color: "#92400e",
        borderRadius: 6,
        padding: "8px 10px",
        marginBottom: 16,
        fontSize: 13,
      }}
    >
      Внимание: количество оконных ригелей задано вручную на вкладке «Оконные ригели».
      Проверьте его по фасадам перед использованием итоговой массы и стоимости.
    </div>
  );
}

function BuildingCountDiagnostics() {
  const { building } = useBuilding();
  const { results } = useBuildingResults();
  const layoutInput = deriveUnifiedBuildingLayoutInput(building);
  const layout = deriveUnifiedBuildingLayoutFromBuilding(building);
  const fachwerkColumnCount = results.column?.fachwerk?.count;
  const totalAcceptedColumnCount =
    fachwerkColumnCount === undefined ? null : layout.columns.mainTotal + fachwerkColumnCount;

  return (
    <details
      style={{
        border: "1px solid #f59e0b",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "#fffbeb",
      }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        Подробная диагностика подсчёта колонн
      </summary>
      <div style={{ color: "#92400e", fontSize: 12, marginBottom: 10 }}>
        Диагностика для обсуждения с ГИПом. Значения не используются в расчёте массы и
        стоимости до подтверждения модели торцевых колонн.
      </div>
      <div style={{ color: "#92400e", fontSize: 12, marginBottom: 10 }}>
        По решению ГИПа: без крана торцевые колонны считаются отдельной группой, с краном —
        основными колоннами рам. Текущий режим: <b>{building.hasCrane ? "с краном" : "без крана"}</b>.
      </div>
      <div
        style={{
          border: "1px solid #fbbf24",
          background: "#fff7ed",
          borderRadius: 6,
          padding: "8px 10px",
          marginBottom: 10,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {totalAcceptedColumnCount === null
          ? "Итого колонн здания появится после расчёта вкладки «Колонна»."
          : `Итого колонн здания: ${totalAcceptedColumnCount} = основных по ГИП ${layout.columns.mainTotal} + фахверковых стоек ${fachwerkColumnCount}`}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(130px, 1fr))",
          gap: 8,
          fontSize: 13,
        }}
      >
        <div>Рам всего: <b>{layout.frames.totalFrameAxes}</b></div>
        <div>Внутренних рам: <b>{layout.frames.interiorFrameAxes}</b></div>
        <div>Торцевых рам: <b>{layout.frames.endFrameAxes}</b></div>
        <div>Шагов вдоль: <b>{layout.frames.frameBays}</b></div>
        <div>Пролётов поперёк: <b>{layoutInput.crossSpanCount}</b></div>
        <div>Крайних колонн, внутренние: <b>{layout.columns.interiorEdge}</b></div>
        <div>Средних колонн, внутренние: <b>{layout.columns.interiorMiddle}</b></div>
        <div>Всего колонн, внутренние: <b>{layout.columns.interiorTotal}</b></div>
        <div>Крайних колонн, все рамы: <b>{layout.columns.allEdge}</b></div>
        <div>Средних колонн, все рамы: <b>{layout.columns.allMiddle}</b></div>
        <div>Всего колонн, все рамы: <b>{layout.columns.allTotal}</b></div>
        <div>Колонн рам на торцевых осях: <b>{layout.columns.endTotal}</b></div>
        <div>Основных крайних по ГИП: <b>{layout.columns.mainEdge}</b></div>
        <div>Основных средних по ГИП: <b>{layout.columns.mainMiddle}</b></div>
        <div>Основных колонн по ГИП: <b>{layout.columns.mainTotal}</b></div>
        <div>В том числе угловых стоек фахверка: <b>{layout.columns.endFachwerkEdge}</b></div>
        <div>Фахверковых стоек по торцам всего: <b>{fachwerkColumnCount ?? "—"}</b></div>
        <div>Всего колонн здания: <b>{totalAcceptedColumnCount ?? "—"}</b></div>
      </div>
    </details>
  );
}

function ColumnCountSummaryBlock({ results }: { results: BuildingResults }) {
  const { building } = useBuilding();
  const summary = buildColumnCountSummary(building, results);

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
      <legend style={{ fontWeight: 600 }}>Колонны — итог по количеству</legend>
      {!summary.hasPublishedColumns && (
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
          Итог по колоннам появится после расчёта вкладки «Колонна».
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
          gap: 8,
          fontSize: 13,
        }}
      >
        <div>Основных колонн по ГИП: <b>{summary.mainByGip}</b></div>
        <div>Опубликовано подбором: <b>{summary.publishedMain ?? "—"}</b></div>
        <div>Фахверковых стоек: <b>{summary.fachwerkPublished ?? "—"}</b></div>
        <div>Всего колонн здания: <b>{summary.totalFormulaText ?? "—"}</b></div>
        <div>Крайних в подборе: <b>{summary.edgePublished ?? "—"}</b></div>
        <div>Средних в подборе: <b>{summary.middlePublished ?? "—"}</b></div>
        <div>Режим: <b>{summary.hasCrane ? "с краном" : "без крана"}</b></div>
        <div>Торцевых осей: <b>{summary.endFrameAxes}</b></div>
      </div>
      {summary.mainCountMismatch && (
        <div
          style={{
            marginTop: 10,
            border: "1px solid #f59e0b",
            background: "#fffbeb",
            color: "#92400e",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          Внимание: количество основных колонн по ГИП отличается от количества,
          опубликованного текущим подбором колонн. Это нужно сверить перед
          использованием итоговой ведомости.
        </div>
      )}
    </fieldset>
  );
}

function PurlinBuildingSummaryBlock({ results }: { results: BuildingResults }) {
  const { building } = useBuilding();
  const summary = buildPurlinBuildingSummary(building, results.purlin);

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
      <legend style={{ fontWeight: 600 }}>Прогоны — итог по количеству</legend>
      {!summary.hasResult && (
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
          Итог по прогонам появится после расчёта вкладки «Прогоны» или авто-подбора в сводке.
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
          gap: 8,
          fontSize: 13,
        }}
      >
        <div>Принятый тип: <b>{summary.selectedType}</b></div>
        <div>Схема: <b>{summary.scheme}</b></div>
        <div>Параметр: <b>{summary.details ?? "—"}</b></div>
        <div>Шт.: <b>{summary.count ?? "—"}</b></div>
        <div>
          Длина 1 шт.: <b>{summary.lengthPerPiece_m == null ? "—" : `${summary.lengthPerPiece_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Σ длина: <b>{summary.totalLength_m == null ? "—" : `${summary.totalLength_m.toFixed(2)} м`}</b>
        </div>
      </div>
    </fieldset>
  );
}

function CraneBeamTrigger() {
  const { building } = useBuilding();
  const { result, calculating, error, handleCalc } = useCraneBeamRunner();
  if (!building.hasCrane) {
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
        <legend style={{ fontWeight: 600 }}>Подкрановая балка</legend>
        <div style={{ fontSize: 13, color: "#475569" }}>
          Кран не включён на вкладке «Колонна», поэтому подкрановая балка не рассчитывается.
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset
      style={{
        border: "1px solid #cbd5e1",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "#f0f9ff",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Подкрановая балка (медленный расчёт)</legend>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => void handleCalc()}
          disabled={calculating}
          style={{
            padding: "8px 18px",
            fontSize: 14,
            fontWeight: 600,
            background: calculating ? "#94a3b8" : "#0369a1",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: calculating ? "wait" : "pointer",
          }}
        >
          {calculating ? "Расчёт..." : result ? "Пересчитать" : "Рассчитать"}
        </button>
        <span style={{ fontSize: 12, color: "#475569" }}>
          {result
            ? "Готово — параметры с вкладки «Подкрановая балка»."
            : "Расчёт ~3–10 секунд через HyperFormula. Параметры — на вкладке «Подкрановая балка»."}
        </span>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>Ошибка: {error}</div>
      )}

      {result && (
        <div
          style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            fontSize: 13,
          }}
        >
          <div>Профиль: <b>{result.profile ?? "—"}</b></div>
          <div>K (Iпр+IIпр): <b>{result.utilizationPercent != null ? result.utilizationPercent.toFixed(2) + " %" : "—"}</b></div>
          <div>Масса 1 балки: <b>{result.weightKg != null ? result.weightKg.toFixed(1) + " кг" : "—"}</b></div>
          <div>Шаг рёбер: <b>{result.ribStepSelectedM != null ? result.ribStepSelectedM.toFixed(2) + " м" : "—"}</b></div>
        </div>
      )}
    </fieldset>
  );
}
