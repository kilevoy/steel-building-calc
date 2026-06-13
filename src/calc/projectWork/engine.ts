import { HyperFormula } from "hyperformula";
import { projectWorkbook } from "./workbook.generated";
import type { ProjectWorkInputs, ProjectWorkResult } from "./types";

/**
 * Движок стоимости проектных работ (раздел КМ) для ангара «Великан».
 *
 * Воспроизводит исходную книгу EXCEL-011 через HyperFormula 1-в-1
 * (совпадение доказано офлайн-оракулом: дефолтный сценарий Z9=195.6,
 * Z10=21.73). В проекте используется только конструктив «Великан»,
 * поэтому движок принудительно выставляет тип здания = Великан и флаг
 * расчёта КМ; прочие ангары обнуляются гейтом исходной книги.
 *
 * Книга строится один раз и кэшируется (как в crane-beam): построение —
 * самая дорогая часть, между расчётами перезаписываются только входные
 * ячейки листа «Сроки и стоимость». Каждый вызов переписывает ВСЕ входы,
 * поэтому результат не зависит от предыдущих расчётов.
 */

type SheetData = Record<string, (string | number | boolean | null)[][]>;

const LICENSE_KEY = "gpl-v3";
const SUMMARY_SHEET = projectWorkbook.summarySheet;
const inputCells = projectWorkbook.inputCells;
const outputCells = projectWorkbook.outputCells;

export const defaultProjectWorkInputs: ProjectWorkInputs = {
  spanCount: 1,
  spanWidth1: 12,
  spanWidth2: 0,
  spanWidth3: 0,
  spanWidth4: 0,
  spanWidth5: 0,
  length: 24,
  framePitch: 6,
  height: 6,
  roof: 2,
  seismic: 1,
  wallMaterial: 1,
  wallThickness: 2,
  windows: true,
  windowCount: 13,
  gates: false,
  doors: true,
  doorCount: 3,
  overheadCrane: false,
  overheadCraneCapacity: 1,
  suspendedCrane: false,
  suspendedCraneCapacity: 1,
  overheadCost: 0,
};

function colToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function address(cell: string, sheet: number): { sheet: number; col: number; row: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(cell);
  if (!m) throw new Error(`Некорректный адрес ячейки: ${cell}`);
  return { sheet, col: colToIndex(m[1]), row: Number(m[2]) - 1 };
}

let cached: { hf: HyperFormula; summarySheet: number } | null = null;

/**
 * Значения, которые подаём в книгу. Тип здания и флаг КМ зафиксированы
 * («только Великан»). Булевы и категориальные входы переводятся в формат
 * книги (TRUE/FALSE, числовые коды).
 */
function buildCellValues(inputs: ProjectWorkInputs): Record<string, string | number | boolean> {
  return {
    buildingType: 3, // Великан — всегда
    kmFlag: true, // раздел КМ — всегда
    spanCount: inputs.spanCount,
    spanWidth1: inputs.spanWidth1,
    spanWidth2: inputs.spanWidth2,
    spanWidth3: inputs.spanWidth3,
    spanWidth4: inputs.spanWidth4,
    spanWidth5: inputs.spanWidth5,
    length: inputs.length,
    framePitch: inputs.framePitch,
    height: inputs.height,
    roof: inputs.roof,
    seismic: inputs.seismic,
    wallMaterial: inputs.wallMaterial,
    wallThickness: inputs.wallThickness,
    windows: inputs.windows,
    windowCount: inputs.windowCount,
    gates: inputs.gates,
    doors: inputs.doors,
    doorCount: inputs.doorCount,
    overheadCrane: inputs.overheadCrane,
    overheadCraneCapacity: inputs.overheadCraneCapacity,
    suspendedCrane: inputs.suspendedCrane,
    suspendedCraneCapacity: inputs.suspendedCraneCapacity,
    overheadCost: inputs.overheadCost,
  };
}

function getEngine(inputs: ProjectWorkInputs): { hf: HyperFormula; summarySheet: number } {
  if (!cached) {
    const hf = HyperFormula.buildFromSheets(projectWorkbook.sheets as unknown as SheetData, {
      licenseKey: LICENSE_KEY,
      useArrayArithmetic: true,
    });
    const summarySheet = hf.getSheetId(SUMMARY_SHEET);
    if (summarySheet === undefined) throw new Error(`Лист "${SUMMARY_SHEET}" не найден в книге.`);
    cached = { hf, summarySheet };
  }

  const { hf, summarySheet } = cached;
  const values = buildCellValues(inputs);
  hf.batch(() => {
    for (const [key, cell] of Object.entries(inputCells) as [keyof typeof inputCells, string][]) {
      const v = values[key as keyof typeof values];
      if (v !== undefined) hf.setCellContents(address(cell, summarySheet), [[v]]);
    }
  });
  return cached;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function calculateProjectWork(inputs: ProjectWorkInputs): ProjectWorkResult {
  const { hf, summarySheet } = getEngine(inputs);
  const read = (cell: string) => numberOrNull(hf.getCellValue(address(cell, summarySheet)));
  return {
    kmCostThousandRub: read(outputCells.kmCostThousandRub),
    kmDurationDays: read(outputCells.kmDurationDays),
    costPerTon: read(outputCells.costPerTon),
  };
}

export { projectWorkbook };
