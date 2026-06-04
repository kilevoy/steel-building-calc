import type { Building } from "./buildingContext";
import type { ResultItem } from "./resultsContext";
import { purlinContinuitySchemeLabel, purlinSelectionModeLabel } from "./purlinSelection";

export interface PurlinBuildingSummary {
  hasResult: boolean;
  selectedType: string;
  scheme: string;
  details: string | null;
  count: number | null;
  lengthPerPiece_m: number | null;
  totalLength_m: number | null;
}

function parseSpacingMm(details: string | undefined): number | null {
  const match = details?.match(/шаг\s+(\d+)\s+мм/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function buildPurlinBuildingSummary(
  building: Building,
  purlin: ResultItem | null,
): PurlinBuildingSummary {
  const spacingMm = parseSpacingMm(purlin?.note);
  const details = spacingMm === null ? null : `шаг ${spacingMm} мм`;

  return {
    hasResult: purlin !== null,
    selectedType: purlinSelectionModeLabel(building.purlinSelectionMode),
    scheme: purlinContinuitySchemeLabel(building.purlinContinuityScheme),
    details,
    count: purlin?.count ?? null,
    lengthPerPiece_m: purlin?.lengthPerPiece_m ?? null,
    totalLength_m: purlin?.totalLength_m ?? null,
  };
}
