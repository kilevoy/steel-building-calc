import type { ResultItem } from "./building/resultsContext";
import type { WindowRiegelResult } from "./calc/windowRiegel/types";

export function buildWindowRiegelResultItem(
  result: WindowRiegelResult | null,
): ResultItem | null {
  const top = result?.lowerAndUpperProfiles?.[0];
  if (!top || top.profile == null || top.weightKg == null) {
    return null;
  }

  return {
    profile: String(top.profile),
    steel: top.steel ? String(top.steel) : "—",
    massPerPiece_kg: top.weightKg,
    count: 1,
    totalMass_kg: top.weightKg,
    cost_rub: 0,
  };
}
