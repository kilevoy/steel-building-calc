import type { Building } from "./buildingContext";
import type { ResultItem } from "./resultsContext";

export interface CraneBeamBuildingSummary {
  hasCrane: boolean;
  hasResult: boolean;
  count: number | null;
  lengthPerPiece_m: number | null;
  totalLength_m: number | null;
  massPerPiece_kg: number | null;
  totalMass_kg: number | null;
  details: string | null;
  message: string | null;
}

export function buildCraneBeamBuildingSummary(
  building: Building,
  craneBeam: ResultItem | null,
): CraneBeamBuildingSummary {
  if (!building.hasCrane) {
    return {
      hasCrane: false,
      hasResult: false,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      details: null,
      message: "Кран не включён, подкрановая балка не рассчитывается.",
    };
  }

  if (!craneBeam) {
    return {
      hasCrane: true,
      hasResult: false,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      details: null,
      message: "Итог появится после расчёта подкрановой балки.",
    };
  }

  return {
    hasCrane: true,
    hasResult: true,
    count: craneBeam.count ?? null,
    lengthPerPiece_m: craneBeam.lengthPerPiece_m ?? null,
    totalLength_m: craneBeam.totalLength_m ?? null,
    massPerPiece_kg: craneBeam.massPerPiece_kg ?? null,
    totalMass_kg: craneBeam.totalMass_kg,
    details: craneBeam.details ?? craneBeam.note ?? null,
    message: null,
  };
}
