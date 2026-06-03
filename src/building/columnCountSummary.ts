import type { Building } from "./buildingContext";
import type { BuildingResults } from "./resultsContext";
import { deriveUnifiedBuildingLayoutFromBuilding } from "./unifiedBuildingInput";

export interface ColumnCountSummary {
  hasPublishedColumns: boolean;
  mainByGip: number;
  publishedMain: number | null;
  edgePublished: number | null;
  middlePublished: number | null;
  fachwerkPublished: number | null;
  totalAccepted: number | null;
  totalFormulaText: string | null;
  endFrameAxes: number;
  hasCrane: boolean;
  mainCountMismatch: boolean;
}

export function buildColumnCountSummary(
  building: Building,
  results: BuildingResults,
): ColumnCountSummary {
  const layout = deriveUnifiedBuildingLayoutFromBuilding(building);
  const columnResults = results.column;
  const hasPublishedColumns = columnResults !== null;
  const edgePublished = columnResults?.edge?.count ?? null;
  const middlePublished = columnResults?.middle?.count ?? null;
  const fachwerkPublished = columnResults?.fachwerk?.count ?? null;
  const publishedMain =
    hasPublishedColumns ? (edgePublished ?? 0) + (middlePublished ?? 0) : null;
  const totalAccepted =
    fachwerkPublished === null ? null : layout.columns.mainTotal + fachwerkPublished;
  const totalFormulaText =
    totalAccepted === null
      ? null
      : `${totalAccepted} = ${layout.columns.mainTotal} основных + ${fachwerkPublished} фахверковых`;

  return {
    hasPublishedColumns,
    mainByGip: layout.columns.mainTotal,
    publishedMain,
    edgePublished,
    middlePublished,
    fachwerkPublished,
    totalAccepted,
    totalFormulaText,
    endFrameAxes: layout.frames.endFrameAxes,
    hasCrane: building.hasCrane,
    mainCountMismatch:
      publishedMain !== null && publishedMain !== layout.columns.mainTotal,
  };
}
