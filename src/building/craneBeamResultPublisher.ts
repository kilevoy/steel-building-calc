import type { CraneCalculationResult } from "../calc/craneBeam/types";
import type { ResultItem } from "./resultsContext";

export function buildCraneBeamResultItem(
  result: CraneCalculationResult | null,
  layout?: {
    buildingLength_m: number;
    beamSpan_m: number;
    priceC345_rubKg?: number;
  },
): ResultItem | null {
  if (!result || !result.profile || result.weightKg == null) {
    return null;
  }

  const bayCount =
    layout && Number.isFinite(layout.buildingLength_m) && Number.isFinite(layout.beamSpan_m) && layout.beamSpan_m > 0
      ? Math.max(1, Math.floor(layout.buildingLength_m / layout.beamSpan_m))
      : 1;
  const count = layout ? 2 * bayCount : 1;
  const lengthPerPiece_m = layout?.beamSpan_m;
  const totalLength_m = lengthPerPiece_m == null ? undefined : count * lengthPerPiece_m;

  return {
    profile: result.profile,
    steel: "С345",
    massPerPiece_kg: result.weightKg,
    count,
    lengthPerPiece_m,
    totalLength_m,
    note: layout ? "2 нитки подкранового пути" : "единичная подобранная балка",
    totalMass_kg: result.weightKg * count,
    cost_rub: result.weightKg * count * (layout?.priceC345_rubKg ?? 0),
  };
}
