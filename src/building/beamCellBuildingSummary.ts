import type { ResultItem } from "./resultsContext";

export interface BeamCellBuildingSummary {
  hasResult: boolean;
  count: number | null;
  lengthPerPiece_m: number | null;
  totalLength_m: number | null;
  massPerPiece_kg: number | null;
  totalMass_kg: number | null;
  details: string | null;
}

export function buildBeamCellBuildingSummary(
  beamCell: ResultItem | null,
): BeamCellBuildingSummary {
  if (!beamCell) {
    return {
      hasResult: false,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      details: null,
    };
  }

  return {
    hasResult: true,
    count: beamCell.count ?? null,
    lengthPerPiece_m: beamCell.lengthPerPiece_m ?? null,
    totalLength_m: beamCell.totalLength_m ?? null,
    massPerPiece_kg: beamCell.massPerPiece_kg ?? null,
    totalMass_kg: beamCell.totalMass_kg,
    details: beamCell.details ?? beamCell.note ?? null,
  };
}
