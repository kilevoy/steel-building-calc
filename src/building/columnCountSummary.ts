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
  acceptedFachwerk: number | null;
  totalAccepted: number | null;
  totalFormulaText: string | null;
  excludedEndFachwerk: number;
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
  const excludedEndFachwerk =
    building.hasCrane && fachwerkPublished !== null
      ? Math.min(fachwerkPublished, layout.columns.endTotal)
      : 0;
  const acceptedFachwerk =
    fachwerkPublished === null ? null : fachwerkPublished - excludedEndFachwerk;
  const totalAccepted =
    acceptedFachwerk === null ? null : layout.columns.mainTotal + acceptedFachwerk;
  const totalFormulaText =
    totalAccepted === null
      ? null
      : `${totalAccepted} = ${layout.columns.mainTotal} основных + ${acceptedFachwerk} фахверковых`;

  return {
    hasPublishedColumns,
    mainByGip: layout.columns.mainTotal,
    publishedMain,
    edgePublished,
    middlePublished,
    fachwerkPublished,
    acceptedFachwerk,
    totalAccepted,
    totalFormulaText,
    excludedEndFachwerk,
    endFrameAxes: layout.frames.endFrameAxes,
    hasCrane: building.hasCrane,
    mainCountMismatch:
      publishedMain !== null && publishedMain !== layout.columns.mainTotal,
  };
}
