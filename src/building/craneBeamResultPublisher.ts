import type { CraneCalculationResult } from "../calc/craneBeam/types";
import type { ResultItem } from "./resultsContext";

export function buildCraneBeamResultItem(
  result: CraneCalculationResult | null,
): ResultItem | null {
  if (!result || !result.profile || result.weightKg == null) {
    return null;
  }

  return {
    profile: result.profile,
    steel: "С345",
    massPerPiece_kg: result.weightKg,
    count: 1,
    note: "единичная подобранная балка; количество крановых путей требуется задать отдельно",
    totalMass_kg: result.weightKg,
    cost_rub: 0,
  };
}
