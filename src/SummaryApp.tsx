import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
import { buildBeamCellBuildingSummary } from "./building/beamCellBuildingSummary";
import { buildColumnCountSummary } from "./building/columnCountSummary";
import { buildCraneBeamBuildingSummary } from "./building/craneBeamBuildingSummary";
import { buildPurlinBuildingSummary } from "./building/purlinSummary";
import { buildTrussBuildingSummary } from "./building/trussBuildingSummary";
import { buildWindowRiegelBuildingSummary } from "./building/windowRiegelBuildingSummary";
import {
  buildSummaryReadiness,
  hasMissingRequiredSummaryItems,
} from "./building/summaryReadiness";
import { calculateBuildingResultsForSummary } from "./building/calculateBuildingResultsForSummary";
import { buildSummaryAutoCalculationKey } from "./building/summaryAutoCalculationKey";
import {
  getAvailablePurlinSelectionModes,
  getPurlinSelectionWarning,
  purlinContinuitySchemeLabel,
  purlinSelectionModeLabel,
} from "./building/purlinSelection";

export function SummaryApp() {
  const { building } = useBuilding();
  const { results, setResult } = useBuildingResults();
  const { handleCalc: handleCraneBeamCalc } = useCraneBeamRunner();
  const [autoCalculating, setAutoCalculating] = useState(false);
  const [autoCalculationErrors, setAutoCalculationErrors] = useState<string[]>([]);
  const lastAutoCalculationKey = useRef<string | null>(null);
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
  const readinessItems = useMemo(
    () => buildSummaryReadiness(building, summaryResults),
    [building, summaryResults],
  );
  const hasMissingSummaryItems = hasMissingRequiredSummaryItems(readinessItems);
  const autoCalculationKey = useMemo(
    () => buildSummaryAutoCalculationKey(building),
    [building],
  );

  const calculateAllForSummary = useCallback(async () => {
    setAutoCalculating(true);
    try {
      lastAutoCalculationKey.current = autoCalculationKey;
      const calculation = calculateBuildingResultsForSummary(building);
      setResult("purlin", calculation.results.purlin);
      setResult("beamCell", calculation.results.beamCell);
      setResult("column", calculation.results.column);
      setResult("truss", calculation.results.truss);
      setResult("windowRiegel", calculation.results.windowRiegel);
      if (!building.hasCrane) {
        setResult("craneBeam", null);
      }

      const nextErrors = [...calculation.errors];
      if (building.hasCrane) {
        try {
          await handleCraneBeamCalc();
        } catch (error) {
          nextErrors.push(`Подкрановая балка: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      setAutoCalculationErrors(nextErrors);
    } finally {
      setAutoCalculating(false);
    }
  }, [autoCalculationKey, building, handleCraneBeamCalc, setResult]);

  useEffect(() => {
    if (autoCalculating || lastAutoCalculationKey.current === autoCalculationKey) {
      return;
    }
    void calculateAllForSummary();
  }, [
    autoCalculating,
    autoCalculationKey,
    calculateAllForSummary,
  ]);

  if (rows.length === 0) {
    return (
      <div>
        <h2 className="page-title">
          Сводка по зданию
          {autoCalculating && (
            <span className="text-small text-muted" style={{ fontWeight: 400, marginLeft: 10 }}>
              ⏳ Пересчёт...
            </span>
          )}
        </h2>
        <p className="text-muted">
          Сводка рассчитывается автоматически по общим параметрам здания.
        </p>
        <BuildingBlock />
        <SummaryCalcErrors
          calculating={autoCalculating}
          errors={autoCalculationErrors}
          onCalculate={() => void calculateAllForSummary()}
        />
        <SummaryReadinessBlock items={readinessItems} hasMissing={hasMissingSummaryItems} />
        <PurlinSelectionWarning warning={purlinWarning} />
        <ColumnCountSummaryBlock results={summaryResults} />
        <TrussBuildingSummaryBlock results={summaryResults} />
        <PurlinBuildingSummaryBlock results={summaryResults} />
        <BeamCellBuildingSummaryBlock results={summaryResults} />
        <WindowRiegelBuildingSummaryBlock results={summaryResults} />
        <BuildingCountDiagnostics />
        <CraneBeamBuildingSummaryBlock results={summaryResults} />
        <CraneBeamTrigger />
      </div>
    );
  }

  return (
    <div>
      <div className="print-only text-small text-muted">
        Калькулятор стального каркаса — отчёт по зданию от{" "}
        {new Date().toLocaleDateString("ru-RU")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          Сводка по зданию
          {autoCalculating && (
            <span className="text-small text-muted" style={{ fontWeight: 400, marginLeft: 10 }}>
              ⏳ Пересчёт...
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn"
          style={{ marginLeft: "auto" }}
          title="Печать или сохранение сводки в PDF через диалог печати браузера"
        >
          🖨 Печать / PDF
        </button>
      </div>
      <p className="text-muted text-small" style={{ marginTop: 4 }}>
        Подобранные профили и металлоёмкость из всех вкладок одновременно. Все данные
        автоматически обновляются при изменении исходных параметров.
      </p>

      <BuildingBlock />
      <SummaryCalcErrors
        calculating={autoCalculating}
        errors={autoCalculationErrors}
        onCalculate={() => void calculateAllForSummary()}
      />
      <SummaryReadinessBlock items={readinessItems} hasMissing={hasMissingSummaryItems} />
      <PurlinSelectionWarning warning={purlinWarning} />
      <ColumnCountSummaryBlock results={summaryResults} />
      <TrussBuildingSummaryBlock results={summaryResults} />
      <PurlinBuildingSummaryBlock results={summaryResults} />
      <BeamCellBuildingSummaryBlock results={summaryResults} />
      <WindowRiegelBuildingSummaryBlock results={summaryResults} />
      <BuildingCountDiagnostics />
      <CraneBeamBuildingSummaryBlock results={summaryResults} />
      <CraneBeamTrigger />
      <IncompleteQuantityWarning
        hasWindowRiegel={!!summaryResults.windowRiegel}
      />

      <h3 style={{ marginBottom: 6 }}>Подобранные элементы</h3>
      <div className="table-wrap" style={{ marginBottom: 24 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Элемент</th>
              <th>Профиль</th>
              <th>Детали</th>
              <th>Сталь</th>
              <th className="num">Шт.</th>
              <th className="num">Длина 1 шт.</th>
              <th className="num">Σ длина</th>
              <th className="num">Масса 1 шт.</th>
              <th className="num">Σ масса</th>
              <th className="num">Σ стоимость</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.label}</td>
                <td>{r.profile}</td>
                <td>{r.details ?? "—"}</td>
                <td>{r.steel}</td>
                <td className="num">{r.count}</td>
                <td className="num">{r.lengthPerPiece_m}</td>
                <td className="num">{r.totalLength_m}</td>
                <td className="num">{r.unitMass_kg}</td>
                <td className="num" style={{ fontWeight: 600 }}>{formatSummaryMass(r.totalMass_kg)}</td>
                <td className="num">{formatSummaryCost(r.cost_rub)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8} style={{ fontWeight: 700 }}>Итого по зданию</td>
              <td className="num" style={{ fontWeight: 700 }}>{formatSummaryMass(totals.totalMass_kg)}</td>
              <td className="num" style={{ fontWeight: 700 }}>{formatSummaryCost(totals.totalCost_rub)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {bySteel.length > 0 && (
        <>
          <h3 style={{ marginBottom: 6 }}>Расход стали по маркам</h3>
          <div className="table-wrap" style={{ marginBottom: 24 }}>
            <table className="table" style={{ maxWidth: 700 }}>
              <thead>
                <tr>
                  <th>Марка стали</th>
                  <th className="num">Σ масса</th>
                  <th className="num">Σ стоимость</th>
                </tr>
              </thead>
              <tbody>
                {bySteel.map((s) => (
                  <tr key={s.steel}>
                    <td style={{ fontWeight: 600 }}>{s.steel}</td>
                    <td className="num">{formatSummaryMass(s.totalMass_kg)}</td>
                    <td className="num">{formatSummaryCost(s.totalCost_rub)}</td>
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
          <div className="table-wrap" style={{ marginBottom: 24 }}>
            <table className="table" style={{ maxWidth: 700 }}>
              <thead>
                <tr>
                  <th>Элемент</th>
                  <th>Профиль</th>
                  <th>Сталь</th>
                  <th className="num">Σ масса</th>
                </tr>
              </thead>
              <tbody>
                {summaryResults.truss.sections.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{s.section}</td>
                    <td>{s.profile}</td>
                    <td>{s.steel}</td>
                    <td className="num">{formatSummaryMass(s.totalMass_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <details className="text-muted text-small" style={{ marginTop: 16 }}>
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
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Исходные данные</legend>
      <div className="grid grid--4" style={{ fontSize: 13 }}>
        {building.city && <div>Город: <b>{building.city}</b></div>}
        <div>Ширина: <b>{building.span_m} м</b></div>
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
          <div className="field__hint">
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
    <div className="note note--warn" style={{ marginBottom: 16 }}>
      {warning}
    </div>
  );
}

/**
 * Сводка пересчитывается автоматически (при открытии и при изменении
 * параметров здания), поэтому постоянной кнопки расчёта нет. Блок
 * показывает только ошибки авторасчёта с кнопкой повтора.
 */
function SummaryCalcErrors({
  calculating,
  errors,
  onCalculate,
}: {
  calculating: boolean;
  errors: string[];
  onCalculate: () => void;
}) {
  if (errors.length === 0) return null;
  return (
    <div className="note note--warn" style={{ marginBottom: 24 }}>
      <b>Часть расчётов не опубликована:</b>
      <ul style={{ margin: "6px 0 0 18px" }}>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={onCalculate} disabled={calculating} className="btn">
          {calculating ? "Расчёт..." : "Повторить расчёт"}
        </button>
      </div>
    </div>
  );
}

function SummaryReadinessBlock({
  items,
  hasMissing,
}: {
  items: ReturnType<typeof buildSummaryReadiness>;
  hasMissing: boolean;
}) {
  return (
    <fieldset
      style={{
        border: hasMissing ? "1px solid var(--c-warn)" : "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: hasMissing ? "var(--c-warn-soft)" : "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Готовность сводки</legend>
      {hasMissing && (
        <div className="text-warn" style={{ fontSize: 13, marginBottom: 8 }}>
          Ведомость пока неполная: есть разделы без опубликованного результата.
        </div>
      )}
      <div
        className="grid grid--3"
        style={{ fontSize: 13 }}
      >
        {items.map((item) => (
          <div key={item.label}>
            <b>{item.label}:</b>{" "}
            <span className={readinessClassName(item.status)}>
              {readinessLabel(item.status)}
            </span>
            <div className="field__hint">{item.message}</div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function readinessLabel(status: "ready" | "missing" | "not-required"): string {
  if (status === "ready") return "готово";
  if (status === "not-required") return "не требуется";
  return "нет расчёта";
}

function readinessClassName(status: "ready" | "missing" | "not-required"): string {
  if (status === "ready") return "text-ok";
  if (status === "not-required") return "text-muted";
  return "text-warn";
}

function IncompleteQuantityWarning({
  hasWindowRiegel,
}: {
  hasWindowRiegel: boolean;
}) {
  if (!hasWindowRiegel) return null;

  return (
    <div className="note note--warn" style={{ marginBottom: 16 }}>
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
        border: "1px solid var(--c-warn)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-warn-soft)",
      }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        Подробная диагностика подсчёта колонн
      </summary>
      <div className="text-warn text-small" style={{ marginBottom: 10 }}>
        Диагностика для обсуждения с ГИПом. Значения не используются в расчёте массы и
        стоимости до подтверждения модели торцевых колонн.
      </div>
      <div className="text-warn text-small" style={{ marginBottom: 10 }}>
        По решению ГИПа: без крана торцевые колонны считаются отдельной группой, с краном —
        основными колоннами рам. Текущий режим: <b>{building.hasCrane ? "с краном" : "без крана"}</b>.
      </div>
      <div className="note note--warn" style={{ marginBottom: 10, fontWeight: 600 }}>
        {totalAcceptedColumnCount === null
          ? "Итого колонн здания появится после расчёта вкладки «Колонна»."
          : `Итого колонн здания: ${totalAcceptedColumnCount} = основных по ГИП ${layout.columns.mainTotal} + фахверковых стоек ${fachwerkColumnCount}`}
      </div>
      <div className="grid grid--4" style={{ fontSize: 13 }}>
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
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Колонны — итог по количеству</legend>
      {!summary.hasPublishedColumns && (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Итог по колоннам появится после расчёта вкладки «Колонна».
        </div>
      )}
      <div className="grid grid--4" style={{ fontSize: 13 }}>
        <div>Основных колонн по ГИП: <b>{summary.mainByGip}</b></div>
        <div>Опубликовано подбором: <b>{summary.publishedMain ?? "—"}</b></div>
        <div>Фахверковых стоек: <b>{summary.fachwerkPublished ?? "—"}</b></div>
        <div>Всего колонн здания: <b>{summary.totalFormulaText ?? "—"}</b></div>
        <div>Крайних в подборе: <b>{summary.edgePublished ?? "—"}</b></div>
        <div>Средних в подборе: <b>{summary.middlePublished ?? "—"}</b></div>
        <div
          title="Правило ГИПа (решение 2026-05-15, подтверждено 2026-06-12): без крана торцевые колонны считаются отдельной группой фахверка; с краном — основными колоннами рам."
        >
          Режим:{" "}
          <b>
            {summary.hasCrane
              ? "с краном — торцы как основные рамы"
              : "без крана — торцы отдельно (фахверк)"}
          </b>
        </div>
        <div>Торцевых осей: <b>{summary.endFrameAxes}</b></div>
      </div>
      {summary.mainCountMismatch && (
        <div className="note note--warn" style={{ marginTop: 10 }}>
          Внимание: количество основных колонн по ГИП отличается от количества,
          опубликованного текущим подбором колонн. Это нужно сверить перед
          использованием итоговой ведомости.
        </div>
      )}
    </fieldset>
  );
}

function TrussBuildingSummaryBlock({ results }: { results: BuildingResults }) {
  const summary = buildTrussBuildingSummary(results.truss);

  return (
    <fieldset
      style={{
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Фермы — итог по количеству</legend>
      {!summary.hasResult && (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Итог по фермам появится после расчёта вкладки «Ферма».
        </div>
      )}
      <div className="grid grid--4" style={{ fontSize: 13 }}>
        <div>Ферм: <b>{summary.count ?? "—"}</b></div>
        <div>Детали: <b>{summary.details ?? "—"}</b></div>
        <div>
          Длина 1 шт.: <b>{summary.lengthPerPiece_m == null ? "—" : `${summary.lengthPerPiece_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Σ длина: <b>{summary.totalLength_m == null ? "—" : `${summary.totalLength_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Масса 1 шт.: <b>{summary.massPerPiece_kg == null ? "—" : formatSummaryMass(summary.massPerPiece_kg)}</b>
        </div>
        <div>
          Σ масса: <b>{summary.totalMass_kg == null ? "—" : formatSummaryMass(summary.totalMass_kg)}</b>
        </div>
        <div>
          Удельно: <b>{summary.unitMass_kg_per_m2 == null ? "—" : `${summary.unitMass_kg_per_m2.toFixed(1)} кг/м²`}</b>
        </div>
      </div>
    </fieldset>
  );
}

function PurlinBuildingSummaryBlock({ results }: { results: BuildingResults }) {
  const { building } = useBuilding();
  const summary = buildPurlinBuildingSummary(building, results.purlin);

  return (
    <fieldset
      style={{
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Прогоны — итог по количеству</legend>
      {!summary.hasResult && (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Итог по прогонам появится после расчёта вкладки «Прогоны» или авто-подбора в сводке.
        </div>
      )}
      <div className="grid grid--4" style={{ fontSize: 13 }}>
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

function BeamCellBuildingSummaryBlock({ results }: { results: BuildingResults }) {
  const summary = buildBeamCellBuildingSummary(results.beamCell);

  return (
    <fieldset
      style={{
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Балка покрытия — итог по количеству</legend>
      {!summary.hasResult && (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Итог по балке покрытия появится после расчёта вкладки «Балка покрытия».
        </div>
      )}
      <div className="grid grid--4" style={{ fontSize: 13 }}>
        <div>Балки: <b>{summary.count ?? "—"}</b></div>
        <div>Детали: <b>{summary.details ?? "—"}</b></div>
        <div>
          Длина 1 шт.: <b>{summary.lengthPerPiece_m == null ? "—" : `${summary.lengthPerPiece_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Σ длина: <b>{summary.totalLength_m == null ? "—" : `${summary.totalLength_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Масса 1 шт.: <b>{summary.massPerPiece_kg == null ? "—" : formatSummaryMass(summary.massPerPiece_kg)}</b>
        </div>
        <div>
          Σ масса: <b>{summary.totalMass_kg == null ? "—" : formatSummaryMass(summary.totalMass_kg)}</b>
        </div>
      </div>
    </fieldset>
  );
}

function WindowRiegelBuildingSummaryBlock({ results }: { results: BuildingResults }) {
  const summary = buildWindowRiegelBuildingSummary(results.windowRiegel);

  return (
    <fieldset
      style={{
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Оконные ригели — итог по количеству</legend>
      {summary.message && (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
          {summary.message}
        </div>
      )}
      <div className="grid grid--4" style={{ fontSize: 13 }}>
        <div>Ригели: <b>{summary.count ?? "—"}</b></div>
        <div>Детали: <b>{summary.details ?? "—"}</b></div>
        <div>
          Длина 1 шт.: <b>{summary.lengthPerPiece_m == null ? "—" : `${summary.lengthPerPiece_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Σ длина: <b>{summary.totalLength_m == null ? "—" : `${summary.totalLength_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Масса 1 шт.: <b>{summary.massPerPiece_kg == null ? "—" : formatSummaryMass(summary.massPerPiece_kg)}</b>
        </div>
        <div>
          Σ масса: <b>{summary.totalMass_kg == null ? "—" : formatSummaryMass(summary.totalMass_kg)}</b>
        </div>
      </div>
    </fieldset>
  );
}

function CraneBeamBuildingSummaryBlock({ results }: { results: BuildingResults }) {
  const { building } = useBuilding();
  const summary = buildCraneBeamBuildingSummary(building, results.craneBeam);

  return (
    <fieldset
      style={{
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Подкрановая балка — итог по количеству</legend>
      {summary.message && (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
          {summary.message}
        </div>
      )}
      <div className="grid grid--4" style={{ fontSize: 13 }}>
        <div>Кран: <b>{summary.hasCrane ? "включён" : "не включён"}</b></div>
        <div>Балки: <b>{summary.count ?? "—"}</b></div>
        <div>Детали: <b>{summary.details ?? "—"}</b></div>
        <div>
          Длина 1 шт.: <b>{summary.lengthPerPiece_m == null ? "—" : `${summary.lengthPerPiece_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Σ длина: <b>{summary.totalLength_m == null ? "—" : `${summary.totalLength_m.toFixed(2)} м`}</b>
        </div>
        <div>
          Масса 1 шт.: <b>{summary.massPerPiece_kg == null ? "—" : formatSummaryMass(summary.massPerPiece_kg)}</b>
        </div>
        <div>
          Σ масса: <b>{summary.totalMass_kg == null ? "—" : formatSummaryMass(summary.totalMass_kg)}</b>
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
          border: "1px solid var(--c-border)",
          padding: 12,
          borderRadius: 6,
          marginBottom: 24,
          background: "var(--c-soft)",
        }}
      >
        <legend style={{ fontWeight: 600 }}>Подкрановая балка</legend>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Кран не включён на вкладке «Колонна», поэтому подкрановая балка не рассчитывается.
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset
      style={{
        border: "1px solid var(--c-border)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
        background: "var(--c-accent-soft)",
      }}
    >
      <legend style={{ fontWeight: 600 }}>Подкрановая балка (медленный расчёт)</legend>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => void handleCalc()}
          disabled={calculating}
          className="btn btn--primary"
        >
          {calculating ? "Расчёт..." : result ? "Пересчитать" : "Рассчитать"}
        </button>
        <span className="text-small text-muted">
          {result
            ? "Готово — параметры с вкладки «Подкрановая балка»."
            : "Расчёт ~3–10 секунд через HyperFormula. Параметры — на вкладке «Подкрановая балка»."}
        </span>
      </div>

      {error && (
        <div className="text-danger" style={{ marginTop: 8, fontSize: 13 }}>Ошибка: {error}</div>
      )}

      {result && (
        <div className="grid grid--4" style={{ marginTop: 10, fontSize: 13 }}>
          <div>Профиль: <b>{result.profile ?? "—"}</b></div>
          <div>K (Iпр+IIпр): <b>{result.utilizationPercent != null ? result.utilizationPercent.toFixed(2) + " %" : "—"}</b></div>
          <div>Масса 1 балки: <b>{result.weightKg != null ? result.weightKg.toFixed(1) + " кг" : "—"}</b></div>
          <div>Шаг рёбер: <b>{result.ribStepSelectedM != null ? result.ribStepSelectedM.toFixed(2) + " м" : "—"}</b></div>
        </div>
      )}
    </fieldset>
  );
}
